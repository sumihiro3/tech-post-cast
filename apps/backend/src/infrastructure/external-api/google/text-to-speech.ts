import { AppConfigService } from '@/app-config/app-config.service';
import { PersonalizedProgramScript } from '@/mastra/schemas';
import { TextToSpeechError } from '@/types/errors';
import { HeadlineTopicProgramScript } from '@domains/radio-program/headline-topic-program';
import { IProgramFileMaker } from '@domains/radio-program/program-file-maker.interface';
import {
  HeadlineTopicProgramAudioFilesGenerateCommand,
  HeadlineTopicProgramAudioFilesGenerateResult,
  ITextToSpeechClient,
  MultiSpeakerHeadlineTopicProgramAudioFilesGenerateCommand,
  MultiSpeakerPersonalizedProgramAudioFilesGenerateCommand,
  PersonalizedProgramAudioFilesGenerateCommand,
  PersonalizedProgramAudioFilesGenerateResult,
  PersonalizedProgramPostExplanationAudioFilePath,
} from '@domains/radio-program/text-to-speech.interface';
import { TextToSpeechClient as TTSClient } from '@google-cloud/text-to-speech';
import { google } from '@google-cloud/text-to-speech/build/protos/protos';
import {
  ContentListUnion,
  GenerateContentConfig,
  GoogleGenAI,
} from '@google/genai';
import { TermsRepository } from '@infrastructure/database/terms/terms.repository';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Term } from '@prisma/client';
import { createDir } from '@tech-post-cast/commons';
import * as fs from 'fs';
import { setTimeout } from 'timers/promises';
import * as wav from 'wav';

/**
 * 話者の種類を表すEnum
 */
export const SpeakerType = {
  POSTEL: 'Postel',
  JOHN: 'John',
} as const;

export type SpeakerType = (typeof SpeakerType)[keyof typeof SpeakerType];

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
      createDir(command.outputDir);
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
      createDir(command.outputDir);

      // パーソナルプログラムの SSML 群を生成する
      const ssmlList = await this.generatePersonalizedProgramSsml(
        command.script,
      );

      // 出力ディレクトリパス
      const outputDirPath = `${command.outputDir}/${command.feed.id}/${command.programDate.getTime()}`;
      createDir(outputDirPath);

      const tmpDir = `${outputDirPath}/tmp`;
      createDir(tmpDir);

      // イントロ部分の音声ファイルを生成する
      const introAudioFiles: string[] = [];
      for (let i = 0; i < ssmlList.opening.length; i++) {
        const introRequest = this.generateTextToSpeechRequest(
          ssmlList.opening[i],
        );
        const introAudioFilePath = `${tmpDir}/opening_${i}.mp3`;
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
          const introAudioFilePath = `${tmpDir}/post-${postIndex + 1}_intro_${i}.mp3`;
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
          const explanationAudioFilePath = `${tmpDir}/post-${postIndex + 1}_explanation_${i}.mp3`;
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
          const summaryAudioFilePath = `${tmpDir}/post-${postIndex + 1}_summary_${i}.mp3`;
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
        const endingAudioFilePath = `${tmpDir}/ending_${i}.mp3`;
        await this.synthesizeSpeech(endingRequest, endingAudioFilePath);
        endingAudioFiles.push(endingAudioFilePath);
      }

      // エンディングの音声ファイルをマージ
      const endingAudioFilePath = `${outputDirPath}/ending.mp3`;
      await this.programFileMaker.mergeAudioFilesSegments(
        endingAudioFiles,
        endingAudioFilePath,
      );

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
   * 複数話者パーソナルプログラムの音声ファイルを生成する（Gemini 2.5 Flash TTS使用）
   * @param command 生成要求コマンド（script型はanyで仮置き。正しい型が判明したら修正）
   * @returns パーソナルプログラム音声ファイルの生成結果
   */
  async generateMultiSpeakerPersonalizedProgramAudioFiles(
    command: MultiSpeakerPersonalizedProgramAudioFilesGenerateCommand,
  ): Promise<PersonalizedProgramAudioFilesGenerateResult> {
    this.logger.debug(
      `TextToSpeechClient.generateMultiSpeakerPersonalizedProgramAudioFiles called`,
      { userId: command.user.id, feedId: command.feed.id },
    );
    try {
      // 出力ディレクトリを作成
      createDir(command.outputDir);
      const outputDirPath = `${command.outputDir}/${command.feed.id}/${command.programDate.getTime()}`;
      createDir(outputDirPath);
      const tmpDir = `${outputDirPath}/tmp`;
      createDir(tmpDir);

      // Style instructions
      const styleInstructions = `スピーカーはエンジニアに役立つ情報を伝えるため優しく丁寧ながらも、明るい番組にするための喋り方をします。`;
      // const styleInstructions = `このラジオ番組は楽しい雰囲気で、スピーカーは日本のFMラジオのような喋り方をします。「ジョン」は、男性で技術的な背景を分かりやすく説明する専門家です。落ち着いたトーンで話します。「ポステル」は、女性の番組の司会者です。一般の視聴者の視点で、素朴な疑問を投げかける聞き手です。知的で物静かな人物で、エンジニアをリスペクトしています。口調は優しく丁寧です。`;

      // オープニング部分の音声ファイルを生成
      const openingText = new ScriptContent(command.script.opening).asString();
      const openingSegments = this.splitScriptBySpeakerAndLength(
        openingText,
        styleInstructions,
      );
      const openingAudioFiles: string[] = [];
      for (let i = 0; i < openingSegments.length; i++) {
        const audioFilePath = `${tmpDir}/opening_${i}.mp3`;
        await this.generateGeminiTTSAudio(openingSegments[i], audioFilePath);
        openingAudioFiles.push(audioFilePath);
      }
      const openingAudioFilePath = `${outputDirPath}/opening.mp3`;
      await this.programFileMaker.mergeAudioFilesSegments(
        openingAudioFiles,
        openingAudioFilePath,
      );

      // 記事解説の音声ファイルを生成
      const postExplanationAudioFilePaths: PersonalizedProgramPostExplanationAudioFilePath[] =
        [];
      for (
        let postIndex = 0;
        postIndex < command.script.posts.length;
        postIndex++
      ) {
        const post = command.script.posts[postIndex];
        // 導入
        const introText = new ScriptContent(post.intro).asString();
        const introSegments = this.splitScriptBySpeakerAndLength(
          introText,
          styleInstructions,
        );
        const introAudioFiles: string[] = [];
        for (let i = 0; i < introSegments.length; i++) {
          const audioFilePath = `${tmpDir}/post-${postIndex + 1}_intro_${i}.mp3`;
          await this.generateGeminiTTSAudio(introSegments[i], audioFilePath);
          introAudioFiles.push(audioFilePath);
        }
        const introAudioFilePath = `${outputDirPath}/post-${postIndex + 1}_intro.mp3`;
        await this.programFileMaker.mergeAudioFilesSegments(
          introAudioFiles,
          introAudioFilePath,
        );
        // 解説
        const explanationText = new ScriptContent(post.explanation).asString();
        const explanationSegments = this.splitScriptBySpeakerAndLength(
          explanationText,
          styleInstructions,
        );
        const explanationAudioFiles: string[] = [];
        for (let i = 0; i < explanationSegments.length; i++) {
          const audioFilePath = `${tmpDir}/post-${postIndex + 1}_explanation_${i}.mp3`;
          await this.generateGeminiTTSAudio(
            explanationSegments[i],
            audioFilePath,
          );
          explanationAudioFiles.push(audioFilePath);
        }
        const explanationAudioFilePath = `${outputDirPath}/post-${postIndex + 1}_explanation.mp3`;
        await this.programFileMaker.mergeAudioFilesSegments(
          explanationAudioFiles,
          explanationAudioFilePath,
        );
        // まとめ
        const summaryText = new ScriptContent(post.summary).asString();
        const summarySegments = this.splitScriptBySpeakerAndLength(
          summaryText,
          styleInstructions,
        );
        const summaryAudioFiles: string[] = [];
        for (let i = 0; i < summarySegments.length; i++) {
          const audioFilePath = `${tmpDir}/post-${postIndex + 1}_summary_${i}.mp3`;
          await this.generateGeminiTTSAudio(summarySegments[i], audioFilePath);
          summaryAudioFiles.push(audioFilePath);
        }
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

      // エンディング部分の音声ファイルを生成
      const endingText = new ScriptContent(command.script.ending).asString();
      const endingSegments = this.splitScriptBySpeakerAndLength(
        endingText,
        styleInstructions,
      );
      const endingAudioFiles: string[] = [];
      for (let i = 0; i < endingSegments.length; i++) {
        const audioFilePath = `${tmpDir}/ending_${i}.mp3`;
        await this.generateGeminiTTSAudio(endingSegments[i], audioFilePath);
        endingAudioFiles.push(audioFilePath);
      }
      const endingAudioFilePath = `${outputDirPath}/ending.mp3`;
      await this.programFileMaker.mergeAudioFilesSegments(
        endingAudioFiles,
        endingAudioFilePath,
      );

      // 生成結果を返す
      const result: PersonalizedProgramAudioFilesGenerateResult = {
        openingAudioFilePath,
        postExplanationAudioFilePaths,
        endingAudioFilePath,
      };
      this.logger.log(
        `複数話者パーソナルプログラムの音声ファイルを生成しました`,
        { result },
      );
      return result;
    } catch (error) {
      const errorMessage = `複数話者パーソナルプログラムの音声ファイル生成に失敗しました`;
      this.logger.error(errorMessage, error.message, error.stack);
      if (!(error instanceof TextToSpeechError)) {
        error = new TextToSpeechError(errorMessage, { cause: error });
      }
      throw error;
    }
  }

  /**
   * 複数話者ヘッドライントピック番組の音声ファイルを生成する（Gemini 2.5 Flash TTS使用）
   * @param command 生成要求コマンド
   * @returns ヘッドライントピック番組音声ファイルの生成結果
   */
  async generateMultiSpeakerHeadlineTopicProgramAudioFiles(
    command: MultiSpeakerHeadlineTopicProgramAudioFilesGenerateCommand,
  ): Promise<HeadlineTopicProgramAudioFilesGenerateResult> {
    this.logger.debug(
      `TextToSpeechClient.generateMultiSpeakerHeadlineTopicProgramAudioFiles called`,
      { command },
    );
    try {
      // 出力ディレクトリを作成
      createDir(command.outputDir);
      const now = Date.now();
      const tmpDir = `${command.outputDir}/tmp_${now}`;
      createDir(tmpDir);

      // Style instructions
      const styleInstructions = `スピーカーはエンジニアに役立つ情報を伝えるため優しく丁寧ながらも、明るい番組にするための喋り方をします。`;

      // イントロ部分の音声ファイルを生成
      const introText = new ScriptContent(command.script.intro).asString();
      const introSegments = this.splitScriptBySpeakerAndLength(
        introText,
        styleInstructions,
      );
      const introAudioFiles: string[] = [];
      for (let i = 0; i < introSegments.length; i++) {
        const audioFilePath = `${tmpDir}/intro_${i}.mp3`;
        await this.generateGeminiTTSAudio(introSegments[i], audioFilePath);
        introAudioFiles.push(audioFilePath);
      }
      const introAudioFilePath = `${command.outputDir}/${now}_intro.mp3`;
      await this.programFileMaker.mergeAudioFilesSegments(
        introAudioFiles,
        introAudioFilePath,
      );

      // 記事紹介の音声ファイルを生成
      const postIntroductionAudioFilePaths: string[] = [];
      for (
        let postIndex = 0;
        postIndex < command.script.posts.length;
        postIndex++
      ) {
        const post = command.script.posts[postIndex];
        const postText = new ScriptContent(post.summary).asString();
        const postSegments = this.splitScriptBySpeakerAndLength(
          postText,
          styleInstructions,
        );
        const postAudioFiles: string[] = [];
        for (let i = 0; i < postSegments.length; i++) {
          const audioFilePath = `${tmpDir}/post-${postIndex + 1}_${i}.mp3`;
          await this.generateGeminiTTSAudio(postSegments[i], audioFilePath);
          postAudioFiles.push(audioFilePath);
        }
        const postAudioFilePath = `${command.outputDir}/${now}_post-${postIndex + 1}.mp3`;
        await this.programFileMaker.mergeAudioFilesSegments(
          postAudioFiles,
          postAudioFilePath,
        );
        postIntroductionAudioFilePaths.push(postAudioFilePath);
      }

      // エンディング部分の音声ファイルを生成
      const endingText = new ScriptContent(command.script.ending).asString();
      const endingSegments = this.splitScriptBySpeakerAndLength(
        endingText,
        styleInstructions,
      );
      const endingAudioFiles: string[] = [];
      for (let i = 0; i < endingSegments.length; i++) {
        const audioFilePath = `${tmpDir}/ending_${i}.mp3`;
        await this.generateGeminiTTSAudio(endingSegments[i], audioFilePath);
        endingAudioFiles.push(audioFilePath);
      }
      const endingAudioFilePath = `${command.outputDir}/${now}_ending.mp3`;
      await this.programFileMaker.mergeAudioFilesSegments(
        endingAudioFiles,
        endingAudioFilePath,
      );

      // 生成結果を返す
      const result: HeadlineTopicProgramAudioFilesGenerateResult = {
        introAudioFilePath,
        postIntroductionAudioFilePaths,
        endingAudioFilePath,
      };

      this.logger.log(
        `複数話者ヘッドライントピック番組の音声ファイルを生成しました`,
        { result },
      );

      return result;
    } catch (error) {
      const errorMessage = `複数話者ヘッドライントピック番組の音声ファイル生成に失敗しました`;
      this.logger.error(errorMessage, error.message, error.stack);
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

  /**
   * 話者と文字数制限を考慮してスクリプトを分割する
   * @param script 分割するスクリプト
   * @param styleInstructions Style instructions
   * @returns 分割されたスクリプトの配列
   */
  private splitScriptBySpeakerAndLength(
    script: string,
    styleInstructions: string,
  ): string[] {
    const maxLength = 2000 - styleInstructions.length - 1; // Style instructions + 改行分を除く
    const segments: string[] = [];
    // 話者ごとに分割
    const lines = script.split('\n').filter((line) => line.trim());
    let currentSegment = '';
    for (const line of lines) {
      const testSegment = currentSegment ? `${currentSegment}\n${line}` : line;
      if (testSegment.length <= maxLength) {
        currentSegment = testSegment;
      } else {
        if (currentSegment) {
          segments.push(`${styleInstructions}\n${currentSegment}`);
        }
        currentSegment = line;
      }
    }
    if (currentSegment) {
      segments.push(`${styleInstructions}\n${currentSegment}`);
    }
    if (segments.length > 0) {
      this.logger.debug(`${segments.length} にセグメント分割しました。`, {
        segments,
      });
    }
    return segments;
  }

  /**
   * Gemini 2.5 Flash TTSを使用して音声ファイルを生成する
   * @param text 音声化するテキスト（Style instructions含む）
   * @param outputFilePath 出力ファイルパス
   */
  private async generateGeminiTTSAudio(
    text: string,
    outputFilePath: string,
  ): Promise<void> {
    this.logger.debug(`TextToSpeechClient.generateGeminiTTSAudio called`, {
      outputFilePath,
      text,
      textLength: text.length,
    });
    const maxRetries = 5;
    const retryDelayMs = 2000; // 2秒
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const apiKey = this.appConfig.GoogleGenAiApiKey;
        const ai = new GoogleGenAI({ apiKey });
        const contents: ContentListUnion = {
          parts: [
            {
              text,
            },
          ],
        };
        const config: GenerateContentConfig = {
          responseModalities: ['AUDIO'],
          speechConfig: {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: [
                {
                  speaker: SpeakerType.POSTEL,
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' },
                  },
                },
                {
                  speaker: SpeakerType.JOHN,
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Sadaltager' },
                  },
                },
              ],
            },
          },
        };
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-preview-tts',
          contents,
          config,
        });
        const data = response.data;
        if (data) {
          const audioBuffer = Buffer.from(data, 'base64');
          await this.saveAudioFile(outputFilePath, audioBuffer);
          return; // 成功したら終了
        } else {
          this.logger.warn(
            `Gemini TTS API から音声データを取得できませんでした (試行 ${attempt}/${maxRetries})`,
            { response },
          );
          if (attempt === maxRetries) {
            throw new TextToSpeechError(
              'Gemini TTS API から音声データを取得できませんでした（最大リトライ回数に達しました）',
            );
          }
          this.logger.debug(`${retryDelayMs}ms 待機してリトライします`, {
            attempt,
          });
          await setTimeout(retryDelayMs);
        }
      } catch (error) {
        const errorMessage = `Gemini TTS API 呼び出し中にエラーが発生しました (試行 ${attempt}/${maxRetries})`;
        this.logger.error(errorMessage, { error, attempt, maxRetries });
        if (attempt === maxRetries) {
          if (!(error instanceof TextToSpeechError)) {
            error = new TextToSpeechError(
              `Gemini TTSでの音声ファイル生成に失敗しました（最大リトライ回数に達しました）`,
              { cause: error },
            );
          }
          throw error;
        }
        // リトライ前に待機（エラーの場合は少し長めに待機）
        const errorRetryDelayMs = retryDelayMs;
        this.logger.debug(`${errorRetryDelayMs}ms 待機してリトライします`, {
          attempt,
          error: error.message,
        });
        await setTimeout(errorRetryDelayMs);
      }
    }
  }

  /**
   * 音声ファイルを保存する
   * @param filename ファイル名
   * @param audioBuffer 音声データ
   */
  async saveAudioFile(filename: string, audioBuffer: Buffer): Promise<void> {
    const waveFilePath = `${filename}.wav`;
    await this.saveWaveFile(waveFilePath, audioBuffer);
    await this.programFileMaker.convertWavToMp3(waveFilePath, filename);
    // await setTimeout(3 * 1000);
  }

  /**
   * 音声ファイルを保存する
   * @param filename ファイル名
   * @param pcmData 音声データ
   * @param channels チャンネル数
   * @param rate サンプリングレート
   * @param sampleWidth サンプル幅
   */
  async saveWaveFile(
    filename,
    pcmData,
    channels = 1,
    rate = 24000,
    sampleWidth = 2,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const writer = new wav.FileWriter(filename, {
        channels,
        sampleRate: rate,
        bitDepth: sampleWidth * 8,
      });

      writer.on('finish', resolve);
      writer.on('error', reject);

      writer.write(pcmData);
      writer.end();
    });
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

/**
 * 台本テキストの整形・正規化用クラス
 */
export class ScriptContent {
  private readonly text: string;

  constructor(text: string) {
    this.text = text ?? '';
  }

  /**
   * 余分な空白や改行を除去し、正規化した文字列を返す
   */
  asString(): string {
    // 連続する空白・改行を1つにまとめ、前後をトリム
    return this.text.replace(/\s+/g, ' ').trim();
  }
}
