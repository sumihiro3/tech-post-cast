import { AppConfigService } from '@/app-config/app-config.service';
import { TextToSpeechError } from '@/types/errors';
import { HeadlineTopicProgramScript } from '@domains/radio-program/headline-topic-program';
import {
  HeadlineTopicProgramAudioFilesGenerateCommand,
  HeadlineTopicProgramAudioFilesGenerateResult,
  ITextToSpeechClient,
} from '@domains/radio-program/text-to-speech.interface';
import { TextToSpeechClient as TTSClient } from '@google-cloud/text-to-speech';
import { google } from '@google-cloud/text-to-speech/build/protos/protos';
import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';

/**
 * Text to speech client
 */
@Injectable()
export class TextToSpeechClient implements ITextToSpeechClient {
  private readonly logger = new Logger(TextToSpeechClient.name);

  /**
   * Text to speech client
   */
  private ttsClient: TTSClient;

  constructor(private readonly appConfig: AppConfigService) {
    this.ttsClient = new TTSClient({
      keyFilename: this.appConfig.GoogleCloudCredentialsFilePath,
    });
  }

  /**
   * Text-to-Speech API を実行して音声ファイルを生成する
   * @param request Text-to-Speech API リクエスト
   * @param outputFilePath 出力先ファイルパス
   */
  async synthesizeSpeech(
    request: google.cloud.texttospeech.v1.ISynthesizeSpeechRequest,
    outputFilePath: string,
  ): Promise<void> {
    this.logger.debug(`TextToSpeechClient.synthesizeSpeech called`, {
      request,
    });
    try {
      // Text-to-Speech API を実行して音声データを取得する
      const [response] = await this.ttsClient.synthesizeSpeech(request);
      if (!response.audioContent) {
        throw new TextToSpeechError(
          'Text to Speech API からのレスポンスがありませんでした',
        );
      }
      // 音声ファイルを出力する
      fs.writeFileSync(outputFilePath, response.audioContent, 'binary');
    } catch (error) {
      const errorMessage = `音声ファイル生成に失敗しました`;
      this.logger.error(errorMessage, { error });
      if (!(error instanceof TextToSpeechError)) {
        error = new TextToSpeechError(errorMessage, { cause: error });
      }
      throw error;
    }
  }

  /**
   * 番組の台本から音声ファイルを生成する
   * @param command 生成要求コマンド
   * @returns ヘッドライントピック番組音声ファイルの生成結果
   */
  async generateHeadlineTopicProgramAudioFiles(
    command: HeadlineTopicProgramAudioFilesGenerateCommand,
  ): Promise<HeadlineTopicProgramAudioFilesGenerateResult> {
    this.logger.debug(
      `TextToSpeechClient.generateHeadlineTopicProgramAudioFile called`,
      { command },
    );
    try {
      if (!fs.existsSync(command.outputDir)) {
        // 出力先ディレクトリが存在しない場合は作成する
        fs.mkdirSync(command.outputDir, { recursive: true });
      }
      // ヘッドライントピック番組の SSML 群を生成する
      const ssmlList = this.generateHeadlineTopicProgramSsml(command.script);
      const now = Date.now();
      // イントロ部分の音声ファイルを生成する
      const introRequest = this.generateTextToSpeechRequest(ssmlList.intro);
      const introAudioFilePath = `${command.outputDir}/${now}_intro.mp3`;
      await this.synthesizeSpeech(introRequest, introAudioFilePath);
      // 記事サマリの音声ファイルを生成する
      const mainAudioFilePaths = ssmlList.postSummaries.map((ssml, index) => {
        const request = this.generateTextToSpeechRequest(ssml);
        const audioFilePath = `${command.outputDir}/${now}_post-${index + 1}.mp3`;
        this.synthesizeSpeech(request, audioFilePath);
        return audioFilePath;
      });
      // エンディング部分の音声ファイルを生成する
      const endingRequest = this.generateTextToSpeechRequest(ssmlList.ending);
      const endingAudioFilePath = `${command.outputDir}/${now}_ending.mp3`;
      await this.synthesizeSpeech(endingRequest, endingAudioFilePath);
      // 生成結果を返す
      const result: HeadlineTopicProgramAudioFilesGenerateResult = {
        introAudioFilePath,
        mainAudioFilePaths,
        endingAudioFilePath,
      };
      this.logger.log(`ヘッドライントピック番組の音声ファイルを生成しました`, {
        result,
      });
      return result;
    } catch (error) {
      const errorMessage = `ヘッドライントピック番組の音声ファイル生成に失敗しました`;
      this.logger.error(errorMessage, { error });
      if (!(error instanceof TextToSpeechError)) {
        error = new TextToSpeechError(errorMessage, { cause: error });
      }
      throw error;
    }
  }

  /**
   * Text to speech のリクエストを生成する
   * @param ssml SSML
   * @returns Text to speech リクエスト
   */
  generateTextToSpeechRequest(
    ssml: string,
  ): google.cloud.texttospeech.v1.ISynthesizeSpeechRequest {
    this.logger.debug(`TextToSpeechClient.generateTextToSpeechRequest called`, {
      ssml,
    });
    // Text to speech リクエストを生成する
    const request: google.cloud.texttospeech.v1.ISynthesizeSpeechRequest = {
      input: {
        ssml,
      },
      voice: {
        languageCode: 'ja-JP',
        name: 'ja-JP-Wavenet-B',
      },
      audioConfig: {
        audioEncoding: 'MP3',
        effectsProfileId: ['handset-class-device'],
        pitch: -2.0,
        speakingRate: 1.06,
      },
    };
    return request;
  }

  /**
   * ヘッドライントピック番組各パートの音声ファイル生成用の SSML を生成する
   * @param script 台本
   * @returns ヘッドライントピック番組各パート用の SSML 生成結果
   */
  generateHeadlineTopicProgramSsml(
    script: HeadlineTopicProgramScript,
  ): HeadlineTopicProgramSsml {
    this.logger.debug(
      `TextToSpeechClient.generateHeadlineTopicProgramSsml called`,
      { script },
    );
    // SSML を生成する
    const breakTime = '1000ms';
    const intro = `<speak>${script.intro}<break time="${breakTime}"/></speak>`;
    const postSummaries = script.posts.map((post) => {
      return `<speak>${post.summary}<break time="${breakTime}"/></speak>`;
    });
    const ending = `<speak>${script.ending}<break time="${breakTime}"/></speak>`;
    const result: HeadlineTopicProgramSsml = {
      intro,
      postSummaries,
      ending,
    };
    this.logger.log(`ヘッドライントピック番組の SSML を生成しました`, {
      result,
    });
    return result;
  }
}

/**
 * ヘッドライントピック番組各パート用の SSML 生成結果
 */
export interface HeadlineTopicProgramSsml {
  /**
   * イントロ部の SSML
   */
  intro: string;
  /**
   * 記事サマリの SSML 一覧
   */
  postSummaries: string[];
  /**
   * エンディング部の SSML
   */
  ending: string;
}
