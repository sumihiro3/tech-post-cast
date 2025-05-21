import { AppConfigService } from '@/app-config/app-config.service';
import { PersonalizedProgramScript } from '@/mastra/schemas';
import { TextToSpeechError } from '@/types/errors';
import { HeadlineTopicProgramScript } from '@domains/radio-program/headline-topic-program';
import { IProgramFileMaker } from '@domains/radio-program/program-file-maker.interface';
import {
  HeadlineTopicProgramAudioFilesGenerateCommand,
  HeadlineTopicProgramAudioFilesGenerateResult,
  ITextToSpeechClient,
  PersonalizedProgramAudioFilesGenerateCommand,
  PersonalizedProgramAudioFilesGenerateResult,
  PersonalizedProgramPostExplanationAudioFilePath,
} from '@domains/radio-program/text-to-speech.interface';
import { TextToSpeechClient as TTSClient } from '@google-cloud/text-to-speech';
import { google } from '@google-cloud/text-to-speech/build/protos/protos';
import { TermsRepository } from '@infrastructure/database/terms/terms.repository';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Term } from '@prisma/client';
import * as fs from 'fs';
import { setTimeout } from 'timers/promises';

/**
 * Text to speech client
 */
@Injectable()
export class TextToSpeechClient implements ITextToSpeechClient {
  private readonly logger = new Logger(TextToSpeechClient.name);

  private ttsClient: TTSClient;
  private terms: Term[];

  /**
   * 絵文字を検出するための正規表現
   */
  regEmoji = new RegExp(
    /[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/,
    'g',
  );

  constructor(
    private readonly appConfig: AppConfigService,
    private readonly termsRepository: TermsRepository,
    @Inject('ProgramFileMaker')
    private readonly programFileMaker: IProgramFileMaker,
  ) {
    const path = this.appConfig.GoogleCloudCredentialsFilePath;
    if (path) {
      this.ttsClient = new TTSClient({
        keyFilename: path,
      });
    } else {
      this.ttsClient = new TTSClient();
    }
  }

  /**
   * 番組の台本からヘッドライントピック番組の音声ファイルを生成する
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
      this.createOutputDir(command.outputDir);
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
   * 番組の台本からパーソナルプログラムの音声ファイルを生成する
   * SSMLをセグメント化して音声ファイルを生成し、マージします
   * @param command 生成要求コマンド
   * @returns パーソナルプログラム音声ファイルの生成結果
   */
  async generatePersonalizedProgramAudioFiles(
    command: PersonalizedProgramAudioFilesGenerateCommand,
  ): Promise<PersonalizedProgramAudioFilesGenerateResult> {
    this.logger.debug(
      `TextToSpeechClient.generatePersonalizedProgramAudioFiles called`,
      { userId: command.user.id, feedId: command.feed.id },
    );
    try {
      // 出力ディレクトリを作成
      this.createOutputDir(command.outputDir);

      // パーソナルプログラムの SSML 群を生成する
      const ssmlList = await this.generatePersonalizedProgramSsml(
        command.script,
      );

      // 出力ディレクトリパス
      const outputDirPath = `${command.outputDir}/${command.feed.id}/${command.programDate.getTime()}`;
      this.createOutputDir(outputDirPath);

      const tempDir = `${outputDirPath}/temp`;
      this.createOutputDir(tempDir);

      // イントロ部分の音声ファイルを生成する
      const introAudioFiles: string[] = [];
      for (let i = 0; i < ssmlList.opening.length; i++) {
        const introRequest = this.generateTextToSpeechRequest(
          ssmlList.opening[i],
        );
        const introAudioFilePath = `${tempDir}/opening_${i}.mp3`;
        await this.synthesizeSpeech(introRequest, introAudioFilePath);
        introAudioFiles.push(introAudioFilePath);
      }

      // イントロの音声ファイルをマージ
      const openingAudioFilePath = `${outputDirPath}/opening.mp3`;
      await this.programFileMaker.mergeAudioFilesSegments(
        introAudioFiles,
        openingAudioFilePath,
      );

      // 記事解説の音声ファイルを生成する
      const postExplanationAudioFilePaths: PersonalizedProgramPostExplanationAudioFilePath[] =
        [];
      for (
        let postIndex = 0;
        postIndex < ssmlList.postExplanations.length;
        postIndex++
      ) {
        const ssml = ssmlList.postExplanations[postIndex];

        // イントロの音声を生成
        const introAudioFiles: string[] = [];
        for (let i = 0; i < ssml.intro.length; i++) {
          const introRequest = this.generateTextToSpeechRequest(ssml.intro[i]);
          const introAudioFilePath = `${tempDir}/post-${postIndex + 1}_intro_${i}.mp3`;
          await this.synthesizeSpeech(introRequest, introAudioFilePath);
          introAudioFiles.push(introAudioFilePath);
        }

        // イントロの音声ファイルをマージ
        const introAudioFilePath = `${outputDirPath}/post-${postIndex + 1}_intro.mp3`;
        await this.programFileMaker.mergeAudioFilesSegments(
          introAudioFiles,
          introAudioFilePath,
        );

        // 説明の音声を生成
        const explanationAudioFiles: string[] = [];
        for (let i = 0; i < ssml.explanation.length; i++) {
          const explanationRequest = this.generateTextToSpeechRequest(
            ssml.explanation[i],
          );
          const explanationAudioFilePath = `${tempDir}/post-${postIndex + 1}_explanation_${i}.mp3`;
          await this.synthesizeSpeech(
            explanationRequest,
            explanationAudioFilePath,
          );
          explanationAudioFiles.push(explanationAudioFilePath);
        }

        // 説明の音声ファイルをマージ
        const explanationAudioFilePath = `${outputDirPath}/post-${postIndex + 1}_explanation.mp3`;
        await this.programFileMaker.mergeAudioFilesSegments(
          explanationAudioFiles,
          explanationAudioFilePath,
        );

        // サマリーの音声を生成
        const summaryAudioFiles: string[] = [];
        for (let i = 0; i < ssml.summary.length; i++) {
          const summaryRequest = this.generateTextToSpeechRequest(
            ssml.summary[i],
          );
          const summaryAudioFilePath = `${tempDir}/post-${postIndex + 1}_summary_${i}.mp3`;
          await this.synthesizeSpeech(summaryRequest, summaryAudioFilePath);
          summaryAudioFiles.push(summaryAudioFilePath);
        }

        // サマリーの音声ファイルをマージ
        const summaryAudioFilePath = `${outputDirPath}/post-${postIndex + 1}_summary.mp3`;
        await this.programFileMaker.mergeAudioFilesSegments(
          summaryAudioFiles,
          summaryAudioFilePath,
        );

        postExplanationAudioFilePaths.push({
          introAudioFilePath,
          explanationAudioFilePath,
          summaryAudioFilePath,
        });
      }

      // エンディング部分の音声ファイルを生成する
      const endingAudioFiles: string[] = [];
      for (let i = 0; i < ssmlList.ending.length; i++) {
        const endingRequest = this.generateTextToSpeechRequest(
          ssmlList.ending[i],
        );
        const endingAudioFilePath = `${tempDir}/ending_${i}.mp3`;
        await this.synthesizeSpeech(endingRequest, endingAudioFilePath);
        endingAudioFiles.push(endingAudioFilePath);
      }

      // エンディングの音声ファイルをマージ
      const endingAudioFilePath = `${outputDirPath}/ending.mp3`;
      await this.programFileMaker.mergeAudioFilesSegments(
        endingAudioFiles,
        endingAudioFilePath,
      );

      // 一時ファイルを削除
      this.logger.debug(`一時ファイルを削除します: ${tempDir}`);
      // 再帰的に一時ディレクトリを削除する
      if (fs.existsSync(tempDir)) {
        const tempFiles = fs.readdirSync(tempDir);
        for (const file of tempFiles) {
          fs.unlinkSync(`${tempDir}/${file}`);
        }
        fs.rmdirSync(tempDir);
      }

      // 生成結果を返す
      const result: PersonalizedProgramAudioFilesGenerateResult = {
        openingAudioFilePath,
        postExplanationAudioFilePaths,
        endingAudioFilePath,
      };

      this.logger.log(`パーソナルプログラムの音声ファイルを生成しました`, {
        userId: command.user.id,
        feedId: command.feed.id,
        result,
      });

      return result;
    } catch (error) {
      const errorMessage = `パーソナルプログラムの音声ファイル生成に失敗しました`;
      this.logger.error(errorMessage, {
        error,
        userId: command.user.id,
        feedId: command.feed.id,
      });
      if (!(error instanceof TextToSpeechError)) {
        error = new TextToSpeechError(errorMessage, { cause: error });
      }
      throw error;
    }
  }

  /**
   * 出力先ディレクトリを作成する
   * @param path 出力先ディレクトリパス
   */
  private createOutputDir(path: string) {
    if (!fs.existsSync(path)) {
      // 出力先ディレクトリが存在しない場合は作成する
      fs.mkdirSync(path, { recursive: true });
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
      this.logger.log(`音声ファイルを生成しました [${outputFilePath}]`);
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
   * パーソナルプログラム各パートの音声ファイル生成用の SSML を生成する
   * @param script 台本
   * @returns パーソナルプログラム各パート用の SSML 生成結果
   */
  async generatePersonalizedProgramSsml(
    script: PersonalizedProgramScript,
  ): Promise<PersonalizedProgramSsml> {
    this.logger.debug(
      `TextToSpeechClient.generatePersonalizedProgramSsml called`,
      { scriptTitle: script.title },
    );

    try {
      // イントロのSSMLを生成
      // 先にテキストをセグメント分割
      const openingSegments = script.opening
        ? this.splitJapaneseTextBySentence(script.opening)
        : [];
      // 分割された各セグメントにSSMLを適用
      const opening = await Promise.all(
        openingSegments.map(async (segment) => {
          const formattedText = await this.formatAudioText(segment);
          return `<speak>${formattedText}<break time="1000ms"/></speak>`;
        }),
      );

      // ポスト説明のSSMLを生成
      const postExplanations: PersonalizedProgramPostExplanationSsml[] = [];
      for (const post of script.posts) {
        // イントロのセグメント分割とSSML適用
        const introSegments = post.intro
          ? this.splitJapaneseTextBySentence(post.intro)
          : [];
        const intro = await Promise.all(
          introSegments.map(async (segment) => {
            const formattedText = await this.formatAudioText(segment);
            return `<speak>${formattedText}<break time="1000ms"/></speak>`;
          }),
        );

        // 説明のセグメント分割とSSML適用
        const explanationSegments = post.explanation
          ? this.splitJapaneseTextBySentence(post.explanation)
          : [];
        const explanation = await Promise.all(
          explanationSegments.map(async (segment) => {
            const formattedText = await this.formatAudioText(segment);
            return `<speak>${formattedText}<break time="1000ms"/></speak>`;
          }),
        );

        // サマリーのセグメント分割とSSML適用
        const summarySegments = post.summary
          ? this.splitJapaneseTextBySentence(post.summary)
          : [];
        const summary = await Promise.all(
          summarySegments.map(async (segment) => {
            const formattedText = await this.formatAudioText(segment);
            return `<speak>${formattedText}<break time="1000ms"/></speak>`;
          }),
        );

        postExplanations.push({
          intro,
          explanation,
          summary,
        });
      }

      // エンディングのセグメント分割とSSML適用
      const endingSegments = script.ending
        ? this.splitJapaneseTextBySentence(script.ending)
        : [];
      const ending = await Promise.all(
        endingSegments.map(async (segment) => {
          const formattedText = await this.formatAudioText(segment);
          return `<speak>${formattedText}<break time="200ms"/></speak>`;
        }),
      );

      const result: PersonalizedProgramSsml = {
        opening,
        postExplanations,
        ending,
      };

      this.logger.log(`パーソナルプログラムの SSML を生成しました`, {
        postCount: script.posts.length,
      });

      return result;
    } catch (error) {
      const errorMessage = `パーソナルプログラムのSSMLの生成に失敗しました`;
      this.logger.error(errorMessage, {
        error,
        scriptTitle: script.title,
      });
      if (!(error instanceof TextToSpeechError)) {
        error = new TextToSpeechError(errorMessage, { cause: error });
      }
      throw error;
    }
  }

  /**
   * 音声文章の整形処理を実施する
   *   - SSML 予約文字をエスケープする
   *   - 音声読上げ時に不要となる文字を削除する
   *   - 句読点などの読み上げ後に空白時間を入れる
   *   - 特定の用語の読み方を <sub> で指定する
   * @param 読み上げる文字列
   * @param 音声読み上げ用に整形された文字列
   */
  async formatAudioText(text: string): Promise<string> {
    this.logger.debug(`TextToSpeechClient.formatAudioText called`, {
      text,
    });
    // SSML 予約文字をエスケープする
    // https://cloud.google.com/text-to-speech/docs/ssml?hl=ja#reserve_characters
    // 文字	エスケープコード
    // &	&amp;
    // "	&quot;
    // '	&apos;
    // <	&lt;
    // >	&gt;
    text = text
      .replaceAll('&', '&amp;') // & は最初にエスケープする
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&apos;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');
    // SSML 生成時にはバッククォートと絵文字を削除する
    // Text-to-Speech API はバッククォートと絵文字を読み上げるため
    // 台本としては可読性の観点からそれらは残しておくので、SSML 生成時にだけ削除する
    text = text.replaceAll('`', '');
    // 改行文字を削除する
    text = text.replaceAll('\n', '');
    // 絵文字を削除する
    text = this.removeEmoji(text);
    // 句点を読み上げ後に一時停止する
    text = text.replaceAll('、', '、<break time="400ms"/>');
    text = text.replaceAll('。', '。<break time="600ms"/>');
    text = text.replaceAll('！', '！<break time="600ms"/>');
    text = text.replaceAll('？', '？<break time="600ms"/>');
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

  /**
   * 日本語テキストを文単位で分割する
   * @param text 分割するテキスト
   * @param maxLength 最大長
   * @returns 分割されたテキストの配列
   */
  private splitJapaneseTextBySentence(
    text: string,
    maxLength: number = 1000,
  ): string[] {
    // 文単位で分割
    const sentences = text.split(/(?<=。)/);

    // セグメントを生成
    const segments: string[] = [];
    let currentSegment = '';
    let currentLength = 0;

    for (const sentence of sentences) {
      const sentenceLength = sentence.length;

      // 現在のセグメントに文を追加できる場合
      if (currentLength + sentenceLength <= maxLength) {
        currentSegment += sentence;
        currentLength += sentenceLength;
      } else {
        // 現在のセグメントを保存
        if (currentSegment) {
          segments.push(currentSegment);
        }

        // 新しいセグメントを開始
        currentSegment = sentence;
        currentLength = sentenceLength;
      }
    }

    // 最後のセグメントを保存
    if (currentSegment) {
      segments.push(currentSegment);
    }

    if (segments.length > 0) {
      this.logger.debug(`${segments.length} にセグメント分割しました。`, {
        segments,
      });
    }

    return segments;
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

/**
 * パーソナルプログラムの記事解説の SSML を表す型
 */
interface PersonalizedProgramPostExplanationSsml {
  /**
   * 導入部分のSSML
   */
  intro: string[];
  /**
   * 解説部分のSSML
   */
  explanation: string[];
  /**
   * まとめ部分のSSML
   */
  summary: string[];
}

/**
 * パーソナルプログラム各パート用の SSML 生成結果
 */
interface PersonalizedProgramSsml {
  /**
   * オープニング部の SSML
   */
  opening: string[];
  /**
   * 記事解説の SSML 一覧
   */
  postExplanations: PersonalizedProgramPostExplanationSsml[];
  /**
   * エンディング部の SSML
   */
  ending: string[];
}
