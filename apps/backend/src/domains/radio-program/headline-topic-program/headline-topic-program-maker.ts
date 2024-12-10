import { QiitaPostApiResponse } from '@/domains/qiita-posts/qiita-posts.entity';
import { QiitaPostsRepository } from '@/infrastructure/database/qiita-posts/qiita-posts.repository';
import { OpenAiApiClient } from '@/infrastructure/external-api/openai-api/openai-api.client';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HeadlineTopicProgram } from '@prisma/client';
import * as ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import { readFile } from 'node:fs/promises';
import * as path from 'path';
import {
  HeadlineTopicProgramGenerateResult,
  HeadlineTopicProgramScript,
} from '.';

import { HeadlineTopicProgramsRepository } from '@/infrastructure/database/headline-topic-programs/headline-topic-programs.repository';
import {
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3';
import { formatDate } from '@tech-post-cast/commons';

@Injectable()
export class HeadlineTopicProgramMaker {
  private readonly logger = new Logger(HeadlineTopicProgramMaker.name);
  // 生成したファイルの出力先ディレクトリ
  private readonly outputDir;

  constructor(
    private readonly configService: ConfigService,
    private readonly qiitaPostsRepository: QiitaPostsRepository,
    private readonly openAiApiClient: OpenAiApiClient,
    private readonly headlineTopicProgramsRepository: HeadlineTopicProgramsRepository,
  ) {
    this.outputDir = this.configService.get<string>(
      'HEADLINE_TOPIC_PROGRAM_TARGET_DIR',
    );
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
      // 「ヘッドライントピック」番組の台本を生成する
      const script = await this.generateScript(programDate, summarizedPosts);
      // 「ヘッドライントピック」番組の台本読み上げ音声ファイルを生成する
      const mainAudioPath = await this.generateMainAudioFile(script);
      // BGM などを組み合わせて「ヘッドライントピック」番組の音声ファイルを生成する
      const generateResult = await this.generateProgramAudioFile(
        script,
        mainAudioPath,
      );
      // 生成した「ヘッドライントピック」番組の音声ファイルを S3 にアップロードする処理を追加
      const url = await this.uploadProgramAudioFile(
        generateResult.audioFilePath,
        programDate,
      );
      this.logger.log(`S3 に番組音声ファイルをアップロードしました`, { url });
      // DB に記事を登録
      const registeredPosts =
        await this.qiitaPostsRepository.upsertQiitaPosts(posts);
      this.logger.debug(`${registeredPosts.length} 件の記事を登録しました`);
      // DB に「ヘッドライントピック」番組を登録する
      const program =
        await this.headlineTopicProgramsRepository.upsertHeadlineTopicProgram(
          programDate,
          registeredPosts,
          generateResult,
          url,
        );
      this.logger.log(`ヘッドライントピック番組を生成しました`, { program });
      return program;
    } catch (error) {
      const errorMessage = `ヘッドライントピック番組の生成中にエラーが発生しました`;
      this.logger.error(errorMessage, error, error.stack);
      // TODO: 独自エラークラスを作成してエラーハンドリングを行う
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
        post.summary = await this.openAiApiClient.summarizePost(post);
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
   * ヘッドライントピック番組の音声ファイルを生成する
   * @param script 台本
   * @param mainAudioPath メイン音声ファイルのパス
   * @return ヘッドライントピック番組の生成結果
   */
  async generateProgramAudioFile(
    script: HeadlineTopicProgramScript,
    mainAudioPath: string,
  ): Promise<HeadlineTopicProgramGenerateResult> {
    this.logger.debug(
      `HeadlineTopicProgramMaker.generateProgramAudioFile called`,
      {
        mainAudioPath,
      },
    );
    const bgmPath = this.configService.get<string>(
      'HEADLINE_TOPIC_PROGRAM_BGM_FILE_PATH',
    );
    const openingPath = this.configService.get<string>(
      'HEADLINE_TOPIC_PROGRAM_OPENING_FILE_PATH',
    );
    const endingPath = this.configService.get<string>(
      'HEADLINE_TOPIC_PROGRAM_ENDING_FILE_PATH',
    );
    const targetFileName = `headline-topic-program_${Date.now()}.mp3`;
    const outputPath = `${this.outputDir}/${targetFileName}`;
    // メイン音声やBGMを組み合わせてラジオ番組を作成する
    const duration = await this.mixAudioFiles(
      mainAudioPath,
      bgmPath,
      openingPath,
      endingPath,
      outputPath,
    );
    // 生成結果を返却
    const result: HeadlineTopicProgramGenerateResult = {
      audioFileName: targetFileName,
      audioFilePath: outputPath,
      duration,
      script,
    };
    this.logger.log(`ラジオ番組を生成しました`, { result });
    return result;
  }

  /**
   * ラジオ番組を作成する
   * @param mainAudioPath メイン音声ファイルのパス
   * @param bgmPath BGM 音声ファイルのパス
   * @param openingPath オープニング音声ファイルのパス
   * @param endingPath エンディング音声ファイルのパス
   * @param targetPath 生成したラジオ番組の保存先パス
   * @returns 生成したラジオ番組の長さ（ミリ秒）
   */
  async mixAudioFiles(
    mainAudioPath: string,
    bgmPath: string,
    openingPath: string,
    endingPath: string,
    targetPath: string,
  ): Promise<number> {
    this.logger.debug(`HeadlineTopicProgramMaker.mixAudioFiles called`);
    this.logger.debug('1. メイン音声と BGM のマージを開始...');
    const mergedMainWithBgmPath = `${this.outputDir}/merged_main_with_bgm.mp3`;
    await this.mergeBgmWithMainAudio(
      mainAudioPath,
      bgmPath,
      mergedMainWithBgmPath,
      2.5,
    );
    this.logger.log('メイン音声と BGM のマージが完了しました。');

    this.logger.log('2. オープニング、メイン音声、エンディングの結合を開始...');
    await this.concatAudioFiles(
      [openingPath, mergedMainWithBgmPath, endingPath],
      targetPath,
    );
    fs.unlinkSync(mergedMainWithBgmPath); // 一時ファイル削除
    const duration = Math.ceil(
      (await this.getAudioDuration(targetPath)) * 1000,
    );

    this.logger.log(
      'オープニング、メイン音声、エンディングの結合が完了しました:',
      targetPath,
      duration,
    );
    return duration;
  }

  /**
   * 音声ファイルの長さを取得
   * @param filePath 音声ファイルのパス
   * @returns 音声ファイルの長さ（秒）
   */
  getAudioDuration = (filePath: string): Promise<number> => {
    this.logger.debug(`HeadlineTopicProgramMaker.getAudioDuration called`, {
      filePath,
    });
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err);
        } else {
          const duration = metadata.format.duration;
          resolve(duration ?? 0);
        }
      });
    });
  };

  /**
   * BGM をメイン音声にマージ
   */
  mergeBgmWithMainAudio = async (
    mainPath: string,
    bgmPath: string,
    outputPath: string,
    volumeBoost = 1.0,
  ): Promise<void> => {
    this.logger.debug(
      `HeadlineTopicProgramMaker.mergeBgmWithMainAudio called`,
      {
        mainPath,
        bgmPath,
        outputPath,
        volumeBoost,
      },
    );
    try {
      const mainAudioDuration = await this.getAudioDuration(mainPath);

      // 一時 BGM ループファイル
      const loopedBgmPath = `${this.outputDir}/looped_bgm.mp3`;

      // BGM をループしてメイン音声の長さに合わせる
      await new Promise<void>((resolve, reject) => {
        ffmpeg(bgmPath)
          .inputOptions(['-stream_loop -1']) // 無限ループ
          .outputOptions([
            `-t ${mainAudioDuration}`,
            '-acodec libmp3lame',
            '-y',
          ]) // メイン音声長に切り詰める
          .save(loopedBgmPath)
          .on('end', resolve)
          .on('error', reject);
      });

      // メイン音声とループした BGM をミックス
      await new Promise<void>((resolve, reject) => {
        ffmpeg()
          .input(mainPath)
          .input(loopedBgmPath)
          .complexFilter([
            '[0:a]volume=2.0[a1]', // メイン音声の音量
            '[1:a]volume=0.05[a2]', // BGM の音量
            '[a1][a2]amix=inputs=2:duration=first:dropout_transition=3[mixed]', // 合成
            `[mixed]volume=${volumeBoost}[out]`, // 全体の音量調整
          ])
          .map('[out]')
          .outputOptions([
            '-acodec libmp3lame', // MP3 エンコーダー
            '-ar 44100', // サンプルレート 44.1KHz
            '-ac 2', // ステレオチャンネル
            '-y', // 上書き許可
          ])
          .output(outputPath)
          .on('end', () => {
            fs.unlinkSync(loopedBgmPath); // 一時 BGM ファイル削除
            resolve();
          })
          .on('error', (err) => {
            this.logger.error(err);
            fs.unlinkSync(loopedBgmPath); // 一時 BGM ファイル削除
            reject(err);
          })
          .run();
      });
    } catch (error) {
      const errorMessage = `BGM マージ中にエラーが発生しました`;
      this.logger.error(errorMessage, { error }, error.stack);
      // TODO: 独自エラークラスを作成してエラーハンドリングを行う
      throw error;
    }
  };

  /**
   * 複数の音声ファイルを結合する
   * @param files 結合する音声ファイルのパス
   * @param outputPath 出力先のパス
   */
  concatAudioFiles = (files: string[], outputPath: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const listFilePath = `${this.outputDir}/file-list.txt`;
      const fileListContent = files
        .map((file) => `file '${path.resolve(file)}'`)
        .join('\n');
      fs.writeFileSync(listFilePath, fileListContent);

      ffmpeg()
        .input(listFilePath)
        .inputOptions(['-f concat', '-safe 0']) // ファイルリストから結合
        .outputOptions(['-c copy', '-y']) // 再エンコードなしで結合
        .outputOptions([
          '-acodec libmp3lame', // MP3 エンコーダー
          '-ar 44100', // サンプルレート 44.1KHz
          '-ac 2', // ステレオ
          '-y', // 上書き許可
        ])
        .save(outputPath)
        .on('end', () => {
          fs.unlinkSync(listFilePath); // 一時ファイル削除
          resolve();
        })
        .on('error', (err) => {
          this.logger.error(err);
          fs.unlinkSync(listFilePath); // 一時ファイル削除
          reject(err);
        });
    });
  };

  /**
   * 番組音声ファイルを S3 にアップロードする
   * @param filePath 番組音声ファイルのパス
   * @param programDate 番組日
   * @returns アップロードした音声ファイルの URL
   */
  async uploadProgramAudioFile(
    filePath: string,
    programDate: Date,
  ): Promise<string> {
    this.logger.debug(
      `HeadlineTopicProgramMaker.uploadProgramAudioFile called`,
      {
        filePath,
        programDate,
      },
    );
    const bucketName = this.configService.get<string>(
      'PROGRAM_AUDIO_BUCKET_NAME',
    );
    try {
      const client = new S3Client({});
      const dt = formatDate(programDate, 'YYYYMMDD');
      const programName = 'headline-topic-program';
      const objectKey = `${programName}/${dt}/${programName}_${dt}.mp3`;
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
        Body: await readFile(filePath),
      });
      // S3 にアップロード
      const response = await client.send(command);
      const urlPrefix = this.configService.get<string>(
        'PROGRAM_AUDIO_FILE_URL_PREFIX',
      );
      const url = `${urlPrefix}/${objectKey}`;
      this.logger.log(`S3 に番組音声ファイルをアップロードしました`, {
        response,
        url,
      });
      return url;
    } catch (caught) {
      if (
        caught instanceof S3ServiceException &&
        caught.name === 'EntityTooLarge'
      ) {
        this.logger.error(
          `Error from S3 while uploading object to ${bucketName}. \
  The object was too large. To upload objects larger than 5GB, use the S3 console (160GB max) \
  or the multipart upload API (5TB max).`,
        );
      } else if (caught instanceof S3ServiceException) {
        this.logger.error(
          `Error from S3 while uploading object to ${bucketName}.  ${caught.name}: ${caught.message}`,
        );
      } else {
        throw caught;
      }
    }
  }
}
