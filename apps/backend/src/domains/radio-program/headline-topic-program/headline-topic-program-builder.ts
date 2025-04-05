import { AppConfigService } from '@/app-config/app-config.service';
import {
  HeadlineTopicProgramError,
  HeadlineTopicProgramGenerateScriptError,
  HeadlineTopicProgramRegenerateError,
} from '@/types/errors';
import { IListenerLettersRepository } from '@domains/listener-letters/listener-letters.repository.interface';
import { QiitaPostApiResponse } from '@domains/qiita-posts/qiita-posts.entity';
import {
  HeadlineTopicProgramChapterInfo,
  ProgramRegenerationType,
} from '@domains/radio-program/headline-topic-program';
import { HeadlineTopicProgramsRepository } from '@infrastructure/database/headline-topic-programs/headline-topic-programs.repository';
import { QiitaPostsRepository } from '@infrastructure/database/qiita-posts/qiita-posts.repository';
import { OpenAiApiClient } from '@infrastructure/external-api/openai-api/openai-api.client';
import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  HeadlineTopicProgram,
  ListenerLetter,
  QiitaPost,
} from '@prisma/client';
import { formatDate } from '@tech-post-cast/commons';
import {
  HeadlineTopicProgramWithQiitaPosts,
  parseHeadlineTopicProgramScript,
} from '@tech-post-cast/database';
import { setTimeout } from 'timers/promises';
import {
  HeadlineTopicProgramGenerateResult,
  HeadlineTopicProgramMetadata,
  HeadlineTopicProgramScript,
  ProgramUploadResult,
} from '.';
import {
  IProgramFileUploader,
  ProgramFileUploadCommand,
} from '../file-uploader.interface';
import {
  IProgramFileMaker,
  ProgramFileChapter,
} from '../program-file-maker.interface';
import {
  HeadlineTopicProgramAudioFilesGenerateCommand,
  HeadlineTopicProgramAudioFilesGenerateResult,
  ITextToSpeechClient,
} from '../text-to-speech.interface';

@Injectable()
export class HeadlineTopicProgramBuilder {
  private readonly logger = new Logger(HeadlineTopicProgramBuilder.name);
  // 生成したファイルの出力先ディレクトリ
  private readonly outputDir;

  constructor(
    private readonly appConfig: AppConfigService,
    private readonly qiitaPostsRepository: QiitaPostsRepository,
    private readonly openAiApiClient: OpenAiApiClient,
    private readonly headlineTopicProgramsRepository: HeadlineTopicProgramsRepository,
    @Inject('ListenerLettersRepository')
    private readonly listenerLettersRepository: IListenerLettersRepository,
    @Inject('ProgramFileMaker')
    private readonly programFileMaker: IProgramFileMaker,
    @Inject('ProgramFileUploader')
    private readonly programFileUploader: IProgramFileUploader,
    @Inject('TextToSpeechClient')
    private readonly textToSpeechClient: ITextToSpeechClient,
  ) {
    this.outputDir = this.appConfig.HeadlineTopicProgramTargetDir;
  }

  /**
   * ヘッドライントピック番組を構築する
   * @params programDate 番組日
   * @param posts 番組で紹介する Qiita 記事一覧
   * @returns ヘッドライントピック番組
   */
  async buildProgram(
    programDate: Date,
    posts: QiitaPostApiResponse[],
  ): Promise<HeadlineTopicProgram> {
    this.logger.debug(`HeadlineTopicProgramMaker.buildProgram called`, {
      programDate,
    });
    try {
      // 対象の記事を要約する
      const summarizedPosts = await this.summarizePosts(posts);
      // 未紹介のお便りを取得する
      const letter = await this.listenerLettersRepository.findUnintroduced();
      // ヘッドライントピック番組の台本を生成する
      const script = await this.generateScript(
        programDate,
        summarizedPosts,
        letter,
      );
      // ヘッドライントピック番組の台本読み上げ音声ファイルを生成する
      const programAudioFilePaths =
        await this.generateProgramAudioFiles(script);
      // BGM などを組み合わせてヘッドライントピック番組の音声ファイルを生成する
      const generateResult = await this.generateProgramFiles(
        script,
        programDate,
        programAudioFilePaths,
      );
      // 生成したヘッドライントピック番組の音声ファイルを S3 にアップロードする
      const uploadResult = await this.uploadProgramFiles(
        generateResult.audioFilePath,
        programDate,
      );
      this.logger.log(`S3 に番組ファイルをアップロードしました`, {
        uploadResult,
      });
      // DB に記事を登録
      const registeredPosts =
        await this.qiitaPostsRepository.upsertQiitaPosts(posts);
      this.logger.debug(`${registeredPosts.length} 件の記事を登録しました`);
      // DB にヘッドライントピック番組を登録する
      const program =
        await this.headlineTopicProgramsRepository.createHeadlineTopicProgram(
          programDate,
          registeredPosts,
          generateResult,
          uploadResult,
        );
      this.logger.log(`ヘッドライントピック番組を生成しました`, { program });
      // リスナーからのお便りを紹介済みにする
      if (letter) {
        await this.listenerLettersRepository.updateAsIntroduced(
          letter,
          program,
        );
        this.logger.log(`リスナーからのお便りを紹介済みにしました`, {
          letter,
        });
      }
      // ヘッドライントピック番組の第本データをベクトル化する
      await this.vectorizeProgram(program);
      this.logger.log(`ヘッドライントピック番組のベクトル化が完了しました`, {
        id: program.id,
        title: program.title,
      });
      return program;
    } catch (error) {
      const errorMessage = `ヘッドライントピック番組の生成中にエラーが発生しました`;
      this.logger.error(errorMessage, error, error.stack);
      throw error;
    }
  }

  /**
   * ヘッドライントピック番組を再生成する
   * @param program ヘッドライントピック番組
   * @param regenerationType 再生成種別
   * @returns 再生成したヘッドライントピック番組
   */
  async regenerateProgram(
    program: HeadlineTopicProgramWithQiitaPosts,
    regenerationType: ProgramRegenerationType,
  ): Promise<HeadlineTopicProgram> {
    this.logger.debug(`HeadlineTopicProgramMaker.regenerateProgram called`, {
      programId: program.id,
      regenerationType,
    });
    if (!regenerationType) {
      throw new HeadlineTopicProgramRegenerateError(
        `再生成種別が指定されていません`,
      );
    }
    try {
      let script: HeadlineTopicProgramScript;
      const programDate = program.createdAt;
      if (regenerationType === 'SCRIPT_AND_AUDIO') {
        // 台本を再生成する場合
        // リスナーからのお便りを取得する
        const letter =
          await this.listenerLettersRepository.findIntroduced(program);

        // 記事IDリストを取得
        const postIds = program.posts.map((post) => post.id);

        // 記事本文を含む完全な記事データを取得
        const postsWithBody =
          await this.qiitaPostsRepository.findWithBodyByIds(postIds);

        // 対象の記事を要約する
        const summarizedPosts = await this.summarizePosts(postsWithBody);

        // ヘッドライントピック番組の台本を生成する
        script = await this.generateScript(
          programDate,
          summarizedPosts,
          letter,
        );
      } else {
        // 台本を再生成しない場合は、番組情報から台本を取得する
        const s = parseHeadlineTopicProgramScript(program.script);
        script = s as HeadlineTopicProgramScript;
        if (!script) {
          throw new HeadlineTopicProgramGenerateScriptError(
            `番組情報 [${program.id}] から台本を取得できませんでした`,
          );
        }
      }
      // ヘッドライントピック番組の台本読み上げ音声ファイルを生成する
      const programAudioFilesGenerateResult =
        await this.generateProgramAudioFiles(script);
      // BGM などを組み合わせてヘッドライントピック番組の音声ファイルを生成する
      const generateResult = await this.generateProgramFiles(
        script,
        programDate,
        programAudioFilesGenerateResult,
      );
      // 生成したヘッドライントピック番組の音声ファイルを S3 にアップロードする
      const uploadResult = await this.uploadProgramFiles(
        generateResult.audioFilePath,
        programDate,
      );
      this.logger.log(`S3 に番組ファイルをアップロードしました`, {
        uploadResult,
      });
      // DB に再生成したヘッドライントピック番組の情報を保存する
      const regeneratedProgram =
        await this.headlineTopicProgramsRepository.updateHeadlineTopicProgram(
          program.id,
          generateResult,
          uploadResult,
        );
      this.logger.log(
        `ヘッドライントピック番組 [${program.id}] を再生成しました`,
        {
          program: regeneratedProgram,
        },
      );
      return regeneratedProgram;
    } catch (error) {
      const errorMessage = `ヘッドライントピック番組 [${program.id}] の再生成中にエラーが発生しました`;
      this.logger.error(errorMessage, error, error.stack);
      if (!(error instanceof HeadlineTopicProgramError)) {
        error = new HeadlineTopicProgramRegenerateError(errorMessage, {
          cause: error,
        });
      }
      throw error;
    }
  }

  /**
   * 対象記事を要約する
   * @param posts 対象記事
   * @returns 要約した記事
   */
  async summarizePosts(
    posts: QiitaPostApiResponse[] | QiitaPost[],
  ): Promise<QiitaPostApiResponse[]> {
    this.logger.debug(`HeadlineTopicProgramMaker.summarizePosts called`, {
      posts,
    });
    // 対象の記事を要約する
    const summarizedPosts = await Promise.all(
      posts.map(async (post) => {
        const result = await this.openAiApiClient.summarizePost(post);
        post.summary = result.summary;
        return post;
      }),
    );
    this.logger.debug(`対象記事を要約しました`, { summaries: summarizedPosts });
    return summarizedPosts;
  }

  /**
   * 台本を生成する
   * @param programDate 番組日
   * @param posts 要約した記事一覧
   * @param letter リスナーからのお便り
   * @returns 台本
   */
  async generateScript(
    programDate: Date,
    posts: QiitaPostApiResponse[],
    letter?: ListenerLetter,
  ): Promise<HeadlineTopicProgramScript> {
    this.logger.debug(`HeadlineTopicProgramMaker.generateScript called`, {
      programDate,
      posts,
      letter,
    });
    // 台本を生成する
    const script =
      await this.openAiApiClient.generateHeadlineTopicProgramScript(
        programDate,
        posts,
        letter,
      );
    this.logger.debug(`台本を生成しました`, { script });
    return script;
  }

  /**
   * ヘッドライントピック番組の音声ファイルを生成する
   * @param script 台本
   * @returns ヘッドライントピック番組音声ファイルの生成結果
   */
  async generateProgramAudioFiles(
    script: HeadlineTopicProgramScript,
  ): Promise<HeadlineTopicProgramAudioFilesGenerateResult> {
    this.logger.debug(
      `HeadlineTopicProgramMaker.generateProgramAudioFiles called`,
      {
        script,
      },
    );
    const command: HeadlineTopicProgramAudioFilesGenerateCommand = {
      script: script,
      outputDir: this.outputDir,
    };
    const result =
      await this.textToSpeechClient.generateHeadlineTopicProgramAudioFiles(
        command,
      );
    this.logger.debug(`ヘッドライントピック番組の音声ファイルを生成しました`, {
      result,
    });
    return result;
  }

  /**
   * ヘッドライントピック番組の音声ファイルと動画ファイルを生成する
   * @param script 台本
   * @param programDate 番組日
   * @param programAudioFileGenerateResult ヘッドライントピック番組の音声ファイル群生成結果
   * @return ヘッドライントピック番組ファイル生成結果
   */
  async generateProgramFiles(
    script: HeadlineTopicProgramScript,
    programDate: Date,
    programAudioFileGenerateResult: HeadlineTopicProgramAudioFilesGenerateResult,
  ): Promise<HeadlineTopicProgramGenerateResult> {
    this.logger.debug(`HeadlineTopicProgramMaker.generateProgramFiles called`, {
      title: script.title,
      programDate,
      programAudioFileGenerateResult,
    });
    await setTimeout(3 * 1000); // 番組音声ファイル書き出しまでに時間を要するケースがあるため3秒待つ
    const bgmAudioFilePath = this.appConfig.HeadlineTopicProgramBgmFilePath;
    const openingAudioFilePath =
      this.appConfig.HeadlineTopicProgramOpeningFilePath;
    const endingAudioFilePath =
      this.appConfig.HeadlineTopicProgramEndingFilePath;
    const programAudioFilePaths = this.createProgramMainAudioFileList(
      programAudioFileGenerateResult,
    );
    const volumeRate = 2.5;
    const now = new Date();
    const programAudioFileName = `headline-topic-program_${now.getTime()}.mp3`;
    const outputFilePath = `${this.outputDir}/${programAudioFileName}`;
    // 番組音声ファイルのチャプターを生成する
    const chapters = await this.generateProgramChapters({
      script,
      programAudioFileGenerateResult,
      openingBgmFilePath: openingAudioFilePath,
      endingBgmFilePath: endingAudioFilePath,
      seShortFilePath: this.appConfig.HeadlineTopicProgramSeShortFilePath,
      seLongFilePath: this.appConfig.HeadlineTopicProgramSeLongFilePath,
    });
    // ラジオ番組のメタデータ情報
    const metadata = new HeadlineTopicProgramMetadata(
      script,
      'Tech Post Cast',
      programDate,
      programAudioFileName,
      chapters,
    );
    // 番組音声ファイルを生成
    const audioResult = await this.programFileMaker.generateProgramAudioFile({
      programAudioFilePaths,
      bgmAudioFilePath,
      openingAudioFilePath,
      endingAudioFilePath,
      outputFilePath,
      volumeRate,
      metadata,
    });
    // 生成結果を返却
    const result: HeadlineTopicProgramGenerateResult = {
      audioFileName: programAudioFileName,
      audioFilePath: outputFilePath,
      audioDuration: audioResult.duration,
      script,
      chapters,
    };
    this.logger.log(`ヘッドライントピック番組を生成しました`, { result });
    return result;
  }

  /**
   * ヘッドライントピック番組のメイン音声ファイルを構成する音声ファイルのリストを生成する
   * @param programAudioFilesGenerateResult ヘッドライントピック番組の音声ファイル群生成結果
   * @returns メイン音声ファイルを構成する音声ファイルのリスト
   */
  createProgramMainAudioFileList(
    programAudioFilesGenerateResult: HeadlineTopicProgramAudioFilesGenerateResult,
  ): string[] {
    this.logger.debug(
      `HeadlineTopicProgramMaker.createProgramMainAudioFileList called`,
      { programAudioFilesGenerateResult },
    );
    // 話題の合間に入れる短い効果音ファイル
    const seShortFilePath = this.appConfig.HeadlineTopicProgramSeShortFilePath;
    // 記事紹介の間に効果音を入れる
    const postIntroductionWithSeFilePaths: string[] = [];
    for (
      let i = 0;
      i < programAudioFilesGenerateResult.postIntroductionAudioFilePaths.length;
      i++
    ) {
      postIntroductionWithSeFilePaths.push(
        programAudioFilesGenerateResult.postIntroductionAudioFilePaths[i],
      );
      // 最後の記事紹介の後には効果音は入れない
      if (
        i <
        programAudioFilesGenerateResult.postIntroductionAudioFilePaths.length -
          1
      ) {
        postIntroductionWithSeFilePaths.push(seShortFilePath);
      }
    }
    // エンディング前に入れる長い効果音ファイル
    const seLongFilePath = this.appConfig.HeadlineTopicProgramSeLongFilePath;
    // 番組の音声ファイル群を結合する
    const programAudioFiles = [
      programAudioFilesGenerateResult.introAudioFilePath,
      // 短い効果音
      seShortFilePath,
      ...postIntroductionWithSeFilePaths,
      seLongFilePath,
      programAudioFilesGenerateResult.endingAudioFilePath,
    ];
    return programAudioFiles;
  }

  /**
   * ヘッドライントピック番組のチャプター情報を生成する
   * @param chapterInfo ヘッドライントピック番組のチャプター情報生成に必要となる情報
   * @returns ヘッドライントピック番組のチャプター情報
   */
  async generateProgramChapters(
    chapterInfo: HeadlineTopicProgramChapterInfo,
  ): Promise<ProgramFileChapter[]> {
    this.logger.debug(
      `HeadlineTopicProgramMaker.generateProgramChapters called`,
      {
        chapterInfo,
      },
    );
    const result: ProgramFileChapter[] = [];
    const seShortDuration = await this.programFileMaker.getAudioDuration(
      chapterInfo.seShortFilePath,
    );
    // オープニングBGM 部分のチャプター
    const openingEndTime = await this.programFileMaker.getAudioDuration(
      chapterInfo.openingBgmFilePath,
    );
    const openingChapter: ProgramFileChapter = {
      title: 'オープニング',
      startTime: 0,
      endTime: openingEndTime,
    };
    this.logger.debug(`オープニング部分のチャプター`, { openingChapter });
    result.push(openingChapter);
    // イントロ部分のチャプター
    const introDuration = await this.programFileMaker.getAudioDuration(
      chapterInfo.programAudioFileGenerateResult.introAudioFilePath,
    );
    const introEndTime = openingEndTime + introDuration + seShortDuration;
    const introChapter: ProgramFileChapter = {
      title: 'イントロ',
      startTime: openingEndTime,
      endTime: introEndTime,
    };
    this.logger.debug(`イントロ部分のチャプター`, { introChapter });
    result.push(introChapter);
    // 紹介記事部分のチャプター
    const posts = chapterInfo.script.posts;
    const postIntroductionAudioFilePaths =
      chapterInfo.programAudioFileGenerateResult.postIntroductionAudioFilePaths;
    let postIntroductionStartTime = introEndTime; // 紹介記事の開始位置
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      const postAudioFilePath = postIntroductionAudioFilePaths[i];
      const postDuration =
        await this.programFileMaker.getAudioDuration(postAudioFilePath);
      // 効果音の長さ（最後の記事以外は短い効果音の時間を入れる）
      const seDuration = i < posts.length - 1 ? seShortDuration : 0;
      const endTime = postIntroductionStartTime + postDuration + seDuration;
      const postIntroductionChapter: ProgramFileChapter = {
        title: `紹介記事 ${i + 1}: ${post.title}`,
        startTime: postIntroductionStartTime,
        endTime,
      };
      postIntroductionStartTime = endTime;
      this.logger.debug(`紹介記事部分のチャプター`, {
        postIntroductionChapter,
      });
      result.push(postIntroductionChapter);
    }
    // エンディング部分のチャプター
    const endingStartTime = postIntroductionStartTime;
    const seLongDuration = await this.programFileMaker.getAudioDuration(
      chapterInfo.seLongFilePath,
    );
    const endingDuration = await this.programFileMaker.getAudioDuration(
      chapterInfo.programAudioFileGenerateResult.endingAudioFilePath,
    );
    const endingBgmDuration = await this.programFileMaker.getAudioDuration(
      chapterInfo.endingBgmFilePath,
    );
    const endingChapter: ProgramFileChapter = {
      title: 'エンディング',
      startTime: endingStartTime,
      endTime:
        endingStartTime + seLongDuration + endingDuration + endingBgmDuration,
    };
    this.logger.debug(`エンディング部分のチャプター`, { endingChapter });
    result.push(endingChapter);
    return result;
  }

  /**
   * 番組音声ファイルを S3 にアップロードする
   * @param audioFilePath 番組音声ファイルのパス
   * @param programDate 番組日
   * @returns アップロード結果
   */
  async uploadProgramFiles(
    audioFilePath: string,
    programDate: Date,
  ): Promise<ProgramUploadResult> {
    this.logger.debug(`HeadlineTopicProgramMaker.uploadProgramFiles called`, {
      audioFilePath,
      programDate,
    });
    const bucketName = this.appConfig.ProgramAudioBucketName;
    const dt = formatDate(programDate, 'YYYYMMDD');
    const programId = 'headline-topic-program';
    const objectKeyPrefix = `${programId}/${dt}/${programId}_${Date.now()}`;
    // 番組音声ファイルをアップロード
    const audioFileUploadCommand: ProgramFileUploadCommand = {
      programId,
      programDate,
      bucketName,
      uploadPath: `${objectKeyPrefix}.mp3`,
      filePath: audioFilePath,
      contentType: 'audio/mpeg',
    };
    const audioUrl = await this.programFileUploader.upload(
      audioFileUploadCommand,
    );
    this.logger.log(`番組音声ファイルをアップロードしました`, {
      uploadCommand: audioFileUploadCommand,
      audioUrl,
    });
    return {
      audioUrl,
    };
  }

  /**
   * ヘッドライントピック番組の台本をベクトル化して DB に登録する
   * @param program ヘッドライントピック番組
   */
  async vectorizeProgram(program: HeadlineTopicProgram): Promise<void> {
    this.logger.debug(`HeadlineTopicProgramMaker.vectorizeProgram called`, {
      program,
    });
    // 台本をベクトル化する
    const vector =
      await this.openAiApiClient.vectorizeHeadlineTopicProgramScript(program);
    // ベクトルを DB に登錋する
    await this.headlineTopicProgramsRepository.setHeadlineTopicProgramScriptVector(
      program.id,
      vector,
    );
    this.logger.log(`ヘッドライントピック番組のベクトル化が完了しました`, {
      programId: program.id,
      vector: {
        model: vector.model,
        length: vector.vector.length,
        tokens: vector.totalTokens,
      },
    });
  }
}
