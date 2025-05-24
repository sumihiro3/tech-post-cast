import { AppConfigService } from '@/app-config/app-config.service';
import {
  ProgramAudioFileGenerationError,
  ProgramVideoFileGenerationError,
} from '@/types/errors';
import {
  GenerateProgramAudioFileCommand,
  GenerateProgramAudioFileResult,
  GenerateProgramVideoFileCommand,
  IProgramFileMaker,
  ProgramFileMetadata,
} from '@domains/radio-program/program-file-maker.interface';
import { Injectable, Logger } from '@nestjs/common';
import { createDir, formatDate } from '@tech-post-cast/commons';
import * as ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import { rm } from 'fs/promises';
import * as path from 'path';
import { setTimeout } from 'timers/promises';

/** ファイル出力完了までの待ち時間 */
const FILE_OUTPUT_WAIT_TIME = 3 * 1000;

/**
 * ffmpeg を利用して番組ファイルを作成するクラス
 */
@Injectable()
export class FfmpegProgramFileMaker implements IProgramFileMaker {
  private readonly logger = new Logger(FfmpegProgramFileMaker.name);

  /** 生成したファイルの出力先ディレクトリ */
  private readonly outputDir;

  constructor(private readonly appConfig: AppConfigService) {
    this.outputDir = this.appConfig.ProgramFileGenerationTempDir;
    createDir(this.outputDir);
  }

  /**
   * 音声ファイルの長さを取得する
   * @param filePath 音声ファイルのパス
   * @returns 音声ファイルの長さ（ミリ秒）
   */
  async getAudioDuration(filePath: string): Promise<number> {
    this.logger.debug(`FfmpegProgramFileMaker.getAudioDuration called`, {
      filePath,
    });
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (error, metadata) => {
        if (error) {
          const errorMessage = `音声ファイル [${filePath}] の長さ取得に失敗しました`;
          this.logger.error(errorMessage, error, error.stack);
          const e = new ProgramAudioFileGenerationError(errorMessage, {
            cause: error,
          });
          reject(e);
        } else {
          this.logger.debug(`音声ファイル [${filePath}] のメタデータ:`, {
            metadata,
          });
          const duration = metadata.format.duration;
          const result = duration ? parseFloat(duration) * 1000 : 0;
          this.logger.debug(`音声ファイル [${filePath}] の長さ: ${result} ms`);
          resolve(result);
        }
      });
    });
  }

  /**
   * 番組の音声ファイルを生成する
   * @param command 番組音声ファイル生成要求コマンド
   */
  async generateProgramAudioFile(
    command: GenerateProgramAudioFileCommand,
  ): Promise<GenerateProgramAudioFileResult> {
    this.logger.debug(
      `FfmpegProgramFileMaker.generateProgramAudioFile called`,
      {
        command,
      },
    );
    try {
      // 1. メイン音声と BGM をマージする
      this.logger.log('1. メイン音声と BGM のマージを開始...');
      const mergedMainWithBgmPath = await this.mergeMainAudioAndBgm(
        command.programAudioFilePaths,
        command.bgmAudioFilePath,
        command.volumeRate,
      );
      this.logger.log('メイン音声と BGM のマージが完了しました。');
      // 2. オープニング、メイン音声、エンディングを結合する
      this.logger.log(
        '2. オープニング、メイン音声、エンディングの結合を開始...',
      );
      await this.concatAudioFiles(
        [
          command.openingAudioFilePath,
          mergedMainWithBgmPath,
          command.endingAudioFilePath,
        ],
        command.outputFilePath,
        command.metadata,
      );
      await setTimeout(5 * 1000); // 5秒待機
      await rm(mergedMainWithBgmPath, { force: true }); // 一時ファイル削除
      const duration = await this.getAudioDuration(command.outputFilePath);
      const result: GenerateProgramAudioFileResult = {
        filePath: command.outputFilePath,
        duration,
      };
      this.logger.log(
        `オープニング、メイン音声、エンディングの結合が完了しました`,
        {
          result,
        },
      );
      return result;
    } catch (error) {
      // エラー処理
      const errorMessage = `番組音声ファイルの生成に失敗しました`;
      this.logger.error(errorMessage, error, error.stack);
      throw new ProgramAudioFileGenerationError(errorMessage, {
        cause: error,
      });
    }
  }

  /**
   * メイン音声ファイルと BGM 音声ファイルをマージする
   * @param programAudioFilePaths ヘッドライントピック番組の音声ファイルパス群
   * @param bgmAudioFilePath BGM 音声ファイルのパス
   * @param volumeRate メイン音声ファイルの音量調整倍率
   * @returns マージした音声ファイルのパス
   */
  async mergeMainAudioAndBgm(
    programAudioFilePaths: string[],
    bgmAudioFilePath: string,
    volumeRate: number,
  ): Promise<string> {
    this.logger.debug(`FfmpegProgramFileMaker.mergeMainAudioAndBgm called`, {
      mainAudioFilePath: programAudioFilePaths,
      bgmAudioFilePath,
      volumeRate,
    });
    try {
      const now = Date.now();
      // メイン音声ファイルを結合する
      const mainAudioFilePath = `${this.outputDir}/${now}_main_audio.mp3`;
      await this.concatAudioFiles(programAudioFilePaths, mainAudioFilePath, {
        artist: 'RadioProgram',
        album: 'HeadlineTopicProgram',
        albumArtist: 'HeadlineTopicProgram',
        copyright: 'copyright',
        title: 'MainAudio',
        date: formatDate(new Date(), 'YYYY'),
        genre: 'Technology',
        language: 'Japanese',
        filename: 'main_audio.mp3',
      });
      await setTimeout(10 * 1000); // 10秒待機
      // メイン音声の長さを取得（秒）
      const mainAudioDuration =
        (await this.getAudioDuration(mainAudioFilePath)) / 1000;
      // 1. BGM をループしてメイン音声の長さに合わせる
      // BGM ファイルをメイン音声の長さに合わせたファイルのパス
      const loopedBgmPath = `${this.outputDir}/${now}_looped_bgm.mp3`;
      await new Promise<void>((resolve, reject) => {
        ffmpeg(bgmAudioFilePath)
          .inputOptions(['-stream_loop -1']) // 無限ループ
          .outputOptions([
            `-t ${mainAudioDuration}`,
            '-acodec libmp3lame',
            '-y',
          ]) // メイン音声長に切り詰める
          .save(loopedBgmPath)
          .on('start', (commandLine) => {
            this.logger.log(
              `メイン音声の長さと同じBGMファイルの生成処理を開始します`,
            );
            this.logger.debug(
              `メイン音声の長さと同じBGMファイルの生成コマンド: ${commandLine}`,
            );
          })
          .on('end', () => {
            this.logger.log(
              `メイン音声の長さと同じBGMファイルの生成処理が完了しました: ${loopedBgmPath}`,
            );
            resolve();
          })
          .on('error', (error) => {
            this.logger.error(
              `メイン音声の長さと同じBGMファイルの生成処理中にエラーが発生しました: ${error.message}`,
              {
                error,
              },
            );
            reject(error);
          })
          .run();
      });
      // メイン音声とループした BGM をミックスする
      const mergedMainWithBgmPath = `${this.outputDir}/${now}_merged_main_with_bgm.mp3`;
      await new Promise<void>((resolve, reject) => {
        ffmpeg()
          .input(mainAudioFilePath)
          .input(loopedBgmPath)
          .complexFilter([
            '[0:a]volume=2.0[a1]', // メイン音声の音量
            '[1:a]volume=0.05[a2]', // BGM の音量
            '[a1][a2]amix=inputs=2:duration=first:dropout_transition=3[mixed]', // 合成
            `[mixed]volume=${volumeRate}[out]`, // 全体の音量調整
          ])
          .map('[out]')
          .outputOptions([
            '-acodec libmp3lame', // MP3 エンコーダー
            '-ar 44100', // サンプルレート 44.1KHz
            '-ac 2', // ステレオチャンネル
            '-y', // 上書き許可
          ])
          .output(mergedMainWithBgmPath)
          .on('start', (commandLine) => {
            this.logger.log(`メイン音声とBGMのマージ処理を開始します`);
            this.logger.debug(
              `メイン音声とBGMのマージ処理のコマンド: ${commandLine}`,
            );
          })
          .on('end', () => {
            this.logger.log(
              `メイン音声とBGMのマージ処理が完了しました: ${mergedMainWithBgmPath}`,
            );
            fs.unlinkSync(loopedBgmPath); // 一時 BGM ファイル削除
            resolve();
          })
          .on('error', (error) => {
            this.logger.error(
              `メイン音声とBGMのマージ処理中にエラーが発生しました: ${error.message}`,
              {
                error,
              },
            );
            fs.unlinkSync(loopedBgmPath); // 一時 BGM ファイル削除
            reject(error);
          })
          .run();
      });
      return mergedMainWithBgmPath;
    } catch (error) {
      // エラー処理
      const errorMessage = `メイン音声ファイル [${programAudioFilePaths}] と BGM 音声ファイル [${bgmAudioFilePath}] のマージに失敗しました`;
      this.logger.error(errorMessage, error, error.stack);
      throw new ProgramAudioFileGenerationError(errorMessage, {
        cause: error,
      });
    }
  }

  /**
   * 複数の音声ファイルを結合する
   * @param files 結合する音声ファイルのパス
   * @param outputPath 出力先のパス
   * @param metadata ラジオ番組のメタデータ情報
   */
  async concatAudioFiles(
    files: string[],
    outputPath: string,
    metadata: ProgramFileMetadata,
  ): Promise<void> {
    this.logger.debug(`FfmpegProgramFileMaker.concatAudioFiles called`, {
      files,
      outputPath,
      metadata,
    });
    return new Promise<void>(async (resolve, reject) => {
      // 結合する音声ファイルのリストを作成
      const now = Date.now();
      const listFilePath = `${this.outputDir}/file-list_${now}.txt`;
      await rm(listFilePath, { force: true }); // 残っている場合は削除
      const fileListContent = files
        .map((file) => `file '${path.resolve(file)}'`)
        .join('\n');
      fs.writeFileSync(listFilePath, fileListContent);
      // ファイルが正常に結合されるまで待機する
      await setTimeout(FILE_OUTPUT_WAIT_TIME);
      // メタデータファイルを生成する
      const metadataFilePath = await this.generateProgramMetadataFile(metadata);
      // 音声ファイルを結合する
      ffmpeg()
        .input(metadataFilePath)
        .inputOptions(['-f ffmetadata']) // ファイルリストから結合
        .outputOptions([
          '-map_metadata 0', // # 0 means copy whatever in the existing meta, 1 means ignore the existing
        ])
        .input(listFilePath)
        .inputOptions(['-f concat', '-safe 0']) // ファイルリストから結合
        .outputOptions(['-c copy']) // 再エンコードなしで結合
        .outputOptions([
          '-acodec libmp3lame', // MP3 エンコーダー
          '-ar 44100', // サンプルレート 44.1KHz
          '-ac 2', // ステレオ
          '-y', // 上書き許可
        ])
        .save(outputPath)
        .on('start', (commandLine) => {
          this.logger.log(`音声ファイルの結合処理を開始します`);
          this.logger.debug(`音声ファイルの結合処理コマンド: ${commandLine}`);
        })
        .on('progress', (progress) => {
          this.logger.debug(`音声ファイルの結合処理中...`, {
            progress,
          });
        })
        .on('end', async () => {
          this.logger.log(
            `音声ファイルの結合処理が完了しました: ${outputPath}`,
          );
          resolve();
        })
        .on('error', (error) => {
          this.logger.error(`音声ファイルの結合処理中にエラーが発生しました`, {
            error,
          });
          reject(error);
        })
        .run();
    });
  }

  /**
   * 番組のメタデータファイルを生成する
   * @param metadata 番組のメタデータ情報
   * @param outputFilePath メタデータファイルの出力先ファイルパス
   */
  async generateProgramMetadataFile(
    metadata: ProgramFileMetadata,
  ): Promise<string> {
    this.logger.debug(
      `FfmpegProgramFileMaker.generateProgramMetadataFile called`,
      {
        metadata,
      },
    );
    const now = Date.now();
    const metadataFilePath = `${this.outputDir}/${now}_metadata.txt`;
    // FFMPEG のメタデータファイル形式に変換
    // @see https://ffmpeg.org//ffmpeg-formats.html#Metadata-2
    let metadataString = `;FFMETADATA1
title=${metadata.title}
artist=${metadata.artist}
album=${metadata.album}
album_artist=${metadata.albumArtist}
date=${metadata.date}
genre=${metadata.genre}
language=${metadata.language}
filename=${metadata.filename}
`;
    // チャプター部分のメタデータを追加
    const chapterStrings = [];
    if (metadata.chapters) {
      for (const chapter of metadata.chapters) {
        chapterStrings.push(
          `[CHAPTER]
TIMEBASE=1/1000
START=${chapter.startTime}
END=${chapter.endTime}
title=${chapter.title}
`,
        );
      }
      // チャプター部分と結合する
      metadataString += chapterStrings.join('');
    }
    this.logger.debug(`メタデータファイルの内容: ${metadataString}`);
    fs.writeFileSync(metadataFilePath, metadataString);
    // ファイルが正常に結合されるまで待機する
    await setTimeout(FILE_OUTPUT_WAIT_TIME);
    this.logger.log(
      `番組のメタデータファイルを生成しました: ${metadataFilePath}`,
    );
    return metadataFilePath;
  }

  /**
   * 番組の動画ファイルを生成する
   * @param command 番組動画ファイル生成要求コマンド
   */
  async generateProgramVideoFile(
    command: GenerateProgramVideoFileCommand,
  ): Promise<void> {
    this.logger.debug(
      `FfmpegProgramFileMaker.generateProgramVideoFile called`,
      {
        command,
      },
    );
    const metadata = command.metadata;
    const videoFilePath = command.outputFilePath;
    // 動画ファイルを生成する
    return new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(command.pictureFilePath)
        .inputOptions([
          '-loop 1', // 画像を無限ループさせる（音声の長さに合わせるため）
        ])
        .input(command.audioFilePath)
        .outputOptions([
          '-vcodec libx264', // 動画エンコードに libx264 を使用（高い互換性と品質）
          '-preset ultrafast', // エンコード速度優先のプリセット（ファイルサイズや品質より速度重視）
          '-threads 8', // エンコード時に使用するスレッド数（8スレッド使用）
          '-acodec aac', // 音声エンコードに AAC を使用（互換性の高いフォーマット）
          '-ab 320k', // 音声のビットレートを 320kbps に設定（高品質な音声）
          '-ac 2', // 音声チャンネル数をステレオ（2チャンネル）に設定
          '-b:v 1M', // 映像のビットレートを1Mbpsに設定
          '-r 24', // フレームレートを24fpsに設定
          '-pix_fmt yuv420p', // ピクセルフォーマットを YUV420 に設定（互換性のため）
          '-profile:v baseline', // 簡易プロファイルを設定
          '-shortest', // 出力を最短の入力に合わせる（音声または画像の短い方に合わせる）
        ])
        // メタデータの埋め込み
        .outputOptions('-metadata', `artist=${metadata.artist}`)
        .outputOptions('-metadata', `album=${metadata.album}`)
        .outputOptions('-metadata', `album_artist=${metadata.albumArtist}`)
        .outputOptions('-metadata', `title=${metadata.title}`)
        .outputOptions('-metadata', `date=${metadata.date}`)
        .outputOptions('-metadata', `genre=${metadata.genre}`)
        .outputOptions('-metadata', `language=${metadata.language}`)
        .outputOptions('-metadata', `filename=${metadata.filename}`)
        .save(videoFilePath) // エンコード結果を指定したファイルパスに保存
        .on('start', (commandLine) => {
          this.logger.log(`番組動画ファイル生成処理を開始します`);
          this.logger.debug(`番組動画ファイル生成処理コマンド: ${commandLine}`);
        })
        .on('progress', (progress) => {
          this.logger.debug(`番組動画ファイル生成処理中...`, {
            progress,
          });
        })
        .on('end', () => {
          this.logger.log(
            `番組動画ファイル生成処理が完了しました: ${videoFilePath}`,
          );
          resolve();
        })
        .on('error', (error) => {
          const errorMessage = `番組動画ファイル生成処理中にエラーが発生しました`;
          this.logger.error(errorMessage, error, error.stack);
          const e = new ProgramVideoFileGenerationError(errorMessage, {
            cause: error,
          });
          reject(e);
        })
        .run();
    });
  }

  /**
   * 複数の音声ファイルをシーケンシャルに結合する（セグメント結合）
   * @param inputFiles 入力音声ファイルのパスの配列
   * @param outputFile 出力音声ファイルのパス
   * @returns 結合された音声ファイルのパス
   */
  async mergeAudioFilesSegments(
    inputFiles: string[],
    outputFile: string,
  ): Promise<string> {
    this.logger.debug(`FfmpegProgramFileMaker.mergeAudioFilesSegments called`, {
      inputFiles,
      outputFile,
    });

    try {
      if (inputFiles.length === 0) {
        throw new Error('入力ファイルがありません');
      }

      if (inputFiles.length === 1) {
        // 入力ファイルが1つの場合はコピーするだけ
        fs.copyFileSync(inputFiles[0], outputFile);
        return outputFile;
      }

      // 結合する音声ファイルのリストを作成
      const now = Date.now();
      const listFilePath = `${this.outputDir}/segment-list_${now}.txt`;
      await rm(listFilePath, { force: true }); // 残っている場合は削除
      const fileListContent = inputFiles
        .map((file) => `file '${path.resolve(file)}'`)
        .join('\n');
      fs.writeFileSync(listFilePath, fileListContent);
      // ファイルが正常に結合されるまで待機する
      await setTimeout(FILE_OUTPUT_WAIT_TIME);

      // FFmpegを使用して音声ファイルをマージ（シーケンシャル結合）
      return new Promise<string>((resolve, reject) => {
        ffmpeg()
          .input(listFilePath)
          .inputOptions(['-f concat', '-safe 0']) // ファイルリストから結合
          .outputOptions([
            '-c copy', // コーデックはコピー（再エンコードしない）
            '-acodec libmp3lame', // MP3エンコーダー
            '-y', // 出力ファイルが存在する場合は上書き
          ])
          .save(outputFile)
          .on('start', (commandLine) => {
            this.logger.log(`音声ファイルのセグメント結合処理を開始します`);
            this.logger.debug(
              `音声ファイルのセグメント結合コマンド: ${commandLine}`,
            );
          })
          .on('end', async () => {
            this.logger.log(
              `音声ファイルのセグメント結合処理が完了しました: ${outputFile}`,
            );
            resolve(outputFile);
          })
          .on('error', (error) => {
            this.logger.error(
              `音声ファイルのセグメント結合処理中にエラーが発生しました`,
              {
                error,
              },
            );
            reject(
              new ProgramAudioFileGenerationError(
                '音声ファイルのセグメント結合に失敗しました',
                {
                  cause: error,
                },
              ),
            );
          })
          .run();
      });
    } catch (error) {
      const errorMessage = `音声ファイルのセグメント結合に失敗しました`;
      this.logger.error(errorMessage, error, error.stack);
      throw new ProgramAudioFileGenerationError(errorMessage, {
        cause: error,
      });
    }
  }
}
