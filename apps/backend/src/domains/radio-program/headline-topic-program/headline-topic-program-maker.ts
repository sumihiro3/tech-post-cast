import { AppConfigService } from '@/app-config/app-config.service';
import {
  HeadlineTopicProgramError,
  HeadlineTopicProgramGenerateScriptError,
  HeadlineTopicProgramRegenerateError,
} from '@/types/errors';
import { QiitaPostApiResponse } from '@domains/qiita-posts/qiita-posts.entity';
import { ProgramRegenerationType } from '@domains/radio-program/headline-topic-program';
import { HeadlineTopicProgramsRepository } from '@infrastructure/database/headline-topic-programs/headline-topic-programs.repository';
import { QiitaPostsRepository } from '@infrastructure/database/qiita-posts/qiita-posts.repository';
import { OpenAiApiClient } from '@infrastructure/external-api/openai-api/openai-api.client';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { HeadlineTopicProgram, QiitaPost } from '@prisma/client';
import { formatDate } from '@tech-post-cast/commons';
import { HeadlineTopicProgramWithQiitaPosts } from '@tech-post-cast/database';
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
import { IProgramFileMaker } from '../program-file-maker.interface';
import {
  HeadlineTopicProgramAudioFilesGenerateCommand,
  HeadlineTopicProgramAudioFilesGenerateResult,
  ITextToSpeechClient,
} from '../text-to-speech.interface';

@Injectable()
export class HeadlineTopicProgramMaker {
  private readonly logger = new Logger(HeadlineTopicProgramMaker.name);
  // 生成したファイルの出力先ディレクトリ
  private readonly outputDir;

  constructor(
    private readonly appConfig: AppConfigService,
    private readonly qiitaPostsRepository: QiitaPostsRepository,
    private readonly openAiApiClient: OpenAiApiClient,
    private readonly headlineTopicProgramsRepository: HeadlineTopicProgramsRepository,
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
   * ヘッドライントピック番組を生成する
   * @params programDate 番組日
   * @param posts 番組で紹介する Qiita 記事一覧
   * @returns ヘッドライントピック番組
   */
  async generateProgram(
    programDate: Date,
    posts: QiitaPostApiResponse[],
  ): Promise<HeadlineTopicProgram> {
    this.logger.debug(`HeadlineTopicProgramMaker.generateProgram called`, {
      programDate,
    });
    try {
      // 対象の記事を要約する
      const summarizedPosts = await this.summarizePosts(posts);
      // ヘッドライントピック番組の台本を生成する
      const script = await this.generateScript(programDate, summarizedPosts);
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
        // 対象の記事を要約する
        const summarizedPosts = await this.summarizePosts(program.posts);
        // ヘッドライントピック番組の台本を生成する
        script = await this.generateScript(programDate, summarizedPosts);
      } else {
        // 台本を再生成しない場合は、番組情報から台本を取得する
        const scriptString = program.script;
        script = JSON.parse(
          scriptString.toString(),
        ) as HeadlineTopicProgramScript;
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
   * @returns 台本
   */
  async generateScript(
    programDate: Date,
    posts: QiitaPostApiResponse[],
  ): Promise<HeadlineTopicProgramScript> {
    this.logger.debug(`HeadlineTopicProgramMaker.generateScript called`, {
      programDate,
      posts,
    });
    // 台本を生成する
    const script =
      await this.openAiApiClient.generateHeadlineTopicProgramScript(
        programDate,
        posts,
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
    // ラジオ番組のメタデータ情報
    const metadata = new HeadlineTopicProgramMetadata(
      script,
      'Tech Post Cast',
      programDate,
      programAudioFileName,
    );
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
      `FfmpegProgramFileMaker.createProgramMainAudioFileList called`,
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
}
