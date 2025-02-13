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
import { TermsRepository } from '@infrastructure/database/terms/terms.repository';
import { Injectable, Logger } from '@nestjs/common';
import { Term } from '@prisma/client';
import * as fs from 'fs';
import { setTimeout } from 'timers/promises';

/**
 * Text to speech client
 */
@Injectable()
export class TextToSpeechClient implements ITextToSpeechClient {
  private readonly logger = new Logger(TextToSpeechClient.name);

  /**
   * 絵文字を検出するための正規表現
   */
  regEmoji = new RegExp(
    /[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/,
    'g',
  );

  /**
   * Text to speech client
   */
  private ttsClient: TTSClient;

  /** 用語と読み方のペア一覧 */
  private terms: Term[];

  constructor(
    private readonly appConfig: AppConfigService,
    private readonly termsRepository: TermsRepository,
  ) {
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
      await setTimeout(1000);
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
      const ssmlList = await this.generateHeadlineTopicProgramSsml(
        command.script,
      );
      const now = Date.now();
      // イントロ部分の音声ファイルを生成する
      const introRequest = this.generateTextToSpeechRequest(ssmlList.intro);
      const introAudioFilePath = `${command.outputDir}/${now}_intro.mp3`;
      await this.synthesizeSpeech(introRequest, introAudioFilePath);
      // 記事紹介の音声ファイルを生成する
      const postIntroductionAudioFilePaths = ssmlList.postSummaries.map(
        (ssml, index) => {
          const request = this.generateTextToSpeechRequest(ssml);
          const audioFilePath = `${command.outputDir}/${now}_post-${index + 1}.mp3`;
          this.synthesizeSpeech(request, audioFilePath);
          return audioFilePath;
        },
      );
      // エンディング部分の音声ファイルを生成する
      const endingRequest = this.generateTextToSpeechRequest(ssmlList.ending);
      const endingAudioFilePath = `${command.outputDir}/${now}_ending.mp3`;
      await this.synthesizeSpeech(endingRequest, endingAudioFilePath);
      // 生成結果を返す
      const result: HeadlineTopicProgramAudioFilesGenerateResult = {
        introAudioFilePath,
        postIntroductionAudioFilePaths,
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
        pitch: -5.0,
        speakingRate: 1.1,
      },
    };
    return request;
  }

  /**
   * ヘッドライントピック番組各パートの音声ファイル生成用の SSML を生成する
   * @param script 台本
   * @returns ヘッドライントピック番組各パート用の SSML 生成結果
   */
  async generateHeadlineTopicProgramSsml(
    script: HeadlineTopicProgramScript,
  ): Promise<HeadlineTopicProgramSsml> {
    this.logger.debug(
      `TextToSpeechClient.generateHeadlineTopicProgramSsml called`,
      { script },
    );
    // SSML を生成する
    const intro = `<speak>${script.intro}<break time="1000ms"/></speak>`;
    const postSummaries: string[] = [];
    for (const post of script.posts) {
      const summary = await this.formatAudioText(post.summary);
      postSummaries.push(`<speak>${summary}<break time="1000ms"/></speak>`);
    }
    const ending = `<speak>${await this.formatAudioText(script.ending)}<break time="200ms"/></speak>`;
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

  /**
   * 音声文章の整形処理を実施する
   *   - 音声読上げ時に不要となる文字を削除する
   *   - 句点を読み上げ後に一時停止する
   *   - 特定の用語の読み方を <sub> で指定する
   * @param 読み上げる文字列
   * @param 音声読み上げ用に整形された文字列
   */
  async formatAudioText(text: string): Promise<string> {
    this.logger.debug(`TextToSpeechClient.formatAudioText called`, {
      text,
    });
    // SSML 生成時にはバッククォートと絵文字を削除する
    // Text-to-Speech API はバッククォートと絵文字を読み上げるため
    // 台本としては可読性の観点からそれらは残しておくので、SSML 生成時にだけ削除する
    text = text.replaceAll('`', '');
    // 絵文字を削除する
    text = this.removeEmoji(text);
    // 句点を読み上げ後に一時停止する
    text = text.replaceAll('。', '。<break time="200ms"/>');
    // 特定の用語の読み方を <sub> で指定した SSML を生成する
    const terms = await this.getTerms();
    for (const term of terms) {
      this.logger.debug(
        `用語 [${term.term}] の読み方を [${term.reading}] に指定します`,
      );
      text = text.replaceAll(
        term.term,
        `<sub alias="${term.reading}">${term.term}</sub> `,
      );
    }
    return text;
  }

  /**
   * 文字列中の絵文字を削除して返す
   * @param text 文字列
   * @returns 絵文字を削除した文字列
   */
  removeEmoji(text: string): string {
    return text.replace(this.regEmoji, '');
  }

  /**
   * 用語と読み方のペア一覧を取得する
   * @returns 用語と読み方のペア一覧
   */
  async getTerms(): Promise<Term[]> {
    this.logger.debug(`TextToSpeechClient.getTerms called`);
    if (!this.terms) {
      // インスタンス変数で保持していない場合は、
      // データベースから用語と読み方のペア一覧を取得する
      this.terms = await this.termsRepository.find();
    }
    return this.terms;
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
