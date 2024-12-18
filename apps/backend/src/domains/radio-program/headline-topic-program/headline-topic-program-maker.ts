import { AppConfigService } from '@/app-config/app-config.service';
import { QiitaPostApiResponse } from '@domains/qiita-posts/qiita-posts.entity';
import { HeadlineTopicProgramsRepository } from '@infrastructure/database/headline-topic-programs/headline-topic-programs.repository';
import { QiitaPostsRepository } from '@infrastructure/database/qiita-posts/qiita-posts.repository';
import { OpenAiApiClient } from '@infrastructure/external-api/openai-api/openai-api.client';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { HeadlineTopicProgram } from '@prisma/client';
import { formatDate } from '@tech-post-cast/commons';
import * as fs from 'fs';
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
      const mainAudioPath = await this.generateMainAudioFile(script);
      // BGM などを組み合わせてヘッドライントピック番組の音声ファイルと動画ファイルを生成する
      const generateResult = await this.generateProgramFiles(
        script,
        programDate,
        mainAudioPath,
      );
      // 生成したヘッドライントピック番組の音声ファイルを S3 にアップロードする処理を追加
      const uploadResult = await this.uploadProgramFiles(
        generateResult.audioFilePath,
        generateResult.videoFilePath,
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
   * 対象記事を要約する
   * @param posts 対象記事
   * @returns 要約した記事
   */
  async summarizePosts(
    posts: QiitaPostApiResponse[],
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
   * メイン音声ファイルを生成する
   * @param script 台本
   * @returns メイン音声ファイルのファイルパス
   */
  async generateMainAudioFile(
    script: HeadlineTopicProgramScript,
  ): Promise<string> {
    this.logger.debug(
      `HeadlineTopicProgramMaker.generateMainAudioFile called`,
      {
        script,
      },
    );
    // 出力先ディレクトリを作成
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
    // メイン音声ファイルを生成する
    const mainAudioPath = `${this.outputDir}/${Date.now()}_main.mp3`;
    await this.openAiApiClient.generateHeadlineTopicProgramAudioFile(
      mainAudioPath,
      script,
    );
    this.logger.debug(`メイン音声ファイルを生成しました`, { mainAudioPath });
    return mainAudioPath;
  }

  /**
   * ヘッドライントピック番組の音声ファイルと動画ファイルを生成する
   * @param script 台本
   * @param programDate 番組日
   * @param mainAudioFilePath メイン音声ファイルのパス
   * @return ヘッドライントピック番組ファイル生成結果
   */
  async generateProgramFiles(
    script: HeadlineTopicProgramScript,
    programDate: Date,
    mainAudioFilePath: string,
  ): Promise<HeadlineTopicProgramGenerateResult> {
    this.logger.debug(`HeadlineTopicProgramMaker.generateProgramFiles called`, {
      title: script.title,
      programDate,
      mainAudioPath: mainAudioFilePath,
    });
    const bgmAudioFilePath = this.appConfig.HeadlineTopicProgramBgmFilePath;
    const openingAudioFilePath =
      this.appConfig.HeadlineTopicProgramOpeningFilePath;
    const endingAudioFilePath =
      this.appConfig.HeadlineTopicProgramEndingFilePath;
    const volumeRate = 2.5;
    const now = new Date();
    const programAudioFileName = `headline-topic-program_${now.getTime()}.mp3`;
    const programAudioFilePath = `${this.outputDir}/${programAudioFileName}`;
    // ラジオ番組のメタデータ情報
    const metadata = new HeadlineTopicProgramMetadata(
      script,
      'Tech Post Cast',
      programDate,
      programAudioFileName,
    );
    const audioResult = await this.programFileMaker.generateProgramAudioFile({
      mainAudioFilePath,
      bgmAudioFilePath,
      openingAudioFilePath,
      endingAudioFilePath,
      outputFilePath: programAudioFilePath,
      volumeRate,
      metadata,
    });
    // 番組音声ファイルから動画ファイル（MP4）を生成する
    const pictureFilePath = this.appConfig.HeadlineTopicProgramPictureFilePath;
    const programVideoFileName = `headline-topic-program_${now.getTime()}.mp4`;
    const programVideoFilePath = `${this.outputDir}/${programVideoFileName}`;
    metadata.filename = programVideoFileName;
    await this.programFileMaker.generateProgramVideoFile({
      audioFilePath: programAudioFilePath,
      pictureFilePath,
      outputFilePath: programVideoFilePath,
      metadata,
    });
    // 生成結果を返却
    const result: HeadlineTopicProgramGenerateResult = {
      audioFileName: programAudioFileName,
      audioFilePath: programAudioFilePath,
      audioDuration: audioResult.duration,
      videoFileName: programVideoFileName,
      videoFilePath: programVideoFilePath,
      script,
    };
    this.logger.log(`ヘッドライントピック番組を生成しました`, { result });
    return result;
  }

  /**
   * 番組音声ファイルと動画ファイルを S3 にアップロードする
   * @param audioFilePath 番組音声ファイルのパス
   * @param videoFilePath 動画ファイルのパス
   * @param programDate 番組日
   * @returns アップロード結果
   */
  async uploadProgramFiles(
    audioFilePath: string,
    videoFilePath: string,
    programDate: Date,
  ): Promise<ProgramUploadResult> {
    this.logger.debug(`HeadlineTopicProgramMaker.uploadProgramFiles called`, {
      audioFilePath,
      videoFilePath,
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
    };
    const audioUrl = await this.programFileUploader.upload(
      audioFileUploadCommand,
    );
    this.logger.log(`番組音声ファイルをアップロードしました`, {
      uploadCommand: audioFileUploadCommand,
      audioUrl,
    });
    // 動画ファイルをアップロード
    const videoFileUploadCommand: ProgramFileUploadCommand = {
      programId,
      programDate,
      bucketName,
      uploadPath: `${objectKeyPrefix}.mp4`,
      filePath: videoFilePath,
    };
    const videoUrl = await this.programFileUploader.upload(
      videoFileUploadCommand,
    );
    this.logger.log(`番組動画ファイルをアップロードしました`, {
      uploadCommand: videoFileUploadCommand,
      videoUrl,
    });
    return {
      audioUrl,
      videoUrl,
    };
  }
}
