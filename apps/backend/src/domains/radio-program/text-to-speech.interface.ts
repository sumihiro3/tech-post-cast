import {
  MultiSpeakerProgramScript,
  PersonalizedProgramScript,
} from '@/mastra/schemas';
import { AppUser } from '@prisma/client';
import { PersonalizedFeedWithFilters } from '@tech-post-cast/database';
import { HeadlineTopicProgramScript } from './headline-topic-program';

/**
 * ヘッドライントピック番組の音声ファイル群生成要求コマンド
 */
export interface HeadlineTopicProgramAudioFilesGenerateCommand {
  /**
   * 台本
   */
  script: HeadlineTopicProgramScript;

  /**
   * 出力先ディレクトリ
   */
  outputDir: string;
}

/**
 * 複数話者ヘッドライントピック番組の音声ファイル群生成要求コマンド
 */
export interface MultiSpeakerHeadlineTopicProgramAudioFilesGenerateCommand {
  /**
   * 台本
   */
  script: HeadlineTopicProgramScript;

  /**
   * 出力先ディレクトリ
   */
  outputDir: string;
}

/**
 * ヘッドライントピック番組の音声ファイル群生成結果
 */
export interface HeadlineTopicProgramAudioFilesGenerateResult {
  /**
   * イントロ部の音声ファイルパス
   */
  introAudioFilePath: string;
  /**
   * 記事紹介の音声ファイルパス一覧
   */
  postIntroductionAudioFilePaths: string[];
  /**
   * エンディング部の音声ファイルパス
   */
  endingAudioFilePath: string;
}

/**
 * パーソナルプログラムの音声ファイル群生成要求コマンド
 */
export interface PersonalizedProgramAudioFilesGenerateCommand {
  /**
   * ユーザ ID
   */
  user: AppUser;
  /**
   * パーソナルフィード
   */
  feed: PersonalizedFeedWithFilters;
  /**
   * 番組日付
   */
  programDate: Date;
  /**
   * 番組台本
   */
  script: PersonalizedProgramScript;
  /**
   * 出力先ディレクトリ
   */
  outputDir: string;
}

/**
 * パーソナルプログラムの記事解説の音声ファイルパスを表す型
 */
export type PersonalizedProgramPostExplanationAudioFilePath = {
  /**
   * 導入部分の音声ファイルパス
   */
  introAudioFilePath: string;
  /**
   * 解説部分の音声ファイルパス
   */
  explanationAudioFilePath: string;
  /**
   * まとめ部分の音声ファイルパス
   */
  summaryAudioFilePath: string;
};

/**
 * パーソナルプログラムの音声ファイル群生成結果
 */
export interface PersonalizedProgramAudioFilesGenerateResult {
  /**
   * オープニング部の音声ファイルパス
   */
  openingAudioFilePath: string;
  /**
   * 記事解説の音声ファイルパス一覧
   */
  postExplanationAudioFilePaths: PersonalizedProgramPostExplanationAudioFilePath[];
  /**
   * エンディング部の音声ファイルパス
   */
  endingAudioFilePath: string;
}

/**
 * 複数話者パーソナルプログラムの音声ファイル群生成要求コマンド
 */
export interface MultiSpeakerPersonalizedProgramAudioFilesGenerateCommand {
  /** ユーザ ID */
  user: AppUser;
  /** パーソナルフィード */
  feed: PersonalizedFeedWithFilters;
  /** 番組日付 */
  programDate: Date;
  /** 番組台本 */
  script: MultiSpeakerProgramScript;
  /** 出力先ディレクトリ */
  outputDir: string;
}

/**
 * Text to speech interface
 */
export interface ITextToSpeechClient {
  /**
   * 番組の台本からヘッドライントピック番組の音声ファイルを生成する
   * @param command 生成要求コマンド
   * @returns ヘッドライントピック番組音声ファイルの生成結果
   */
  generateHeadlineTopicProgramAudioFiles(
    command: HeadlineTopicProgramAudioFilesGenerateCommand,
  ): Promise<HeadlineTopicProgramAudioFilesGenerateResult>;

  /**
   * 複数話者ヘッドライントピック番組の音声ファイルを生成する
   * @param command 生成要求コマンド
   * @returns ヘッドライントピック番組音声ファイルの生成結果
   */
  generateMultiSpeakerHeadlineTopicProgramAudioFiles(
    command: MultiSpeakerHeadlineTopicProgramAudioFilesGenerateCommand,
  ): Promise<HeadlineTopicProgramAudioFilesGenerateResult>;

  /**
   * 番組の台本からパーソナルプログラムの音声ファイルを生成する
   * @param command 生成要求コマンド
   * @returns パーソナルプログラム音声ファイルの生成結果
   */
  generatePersonalizedProgramAudioFiles(
    command: PersonalizedProgramAudioFilesGenerateCommand,
  ): Promise<PersonalizedProgramAudioFilesGenerateResult>;

  /**
   * 複数話者パーソナルプログラムの音声ファイルを生成する（Gemini 2.5 Flash TTS用）
   * @param command 生成要求コマンド（型はanyで仮置き）
   * @returns パーソナルプログラム音声ファイルの生成結果
   */
  generateMultiSpeakerPersonalizedProgramAudioFiles(
    command: MultiSpeakerPersonalizedProgramAudioFilesGenerateCommand,
  ): Promise<PersonalizedProgramAudioFilesGenerateResult>;
}
