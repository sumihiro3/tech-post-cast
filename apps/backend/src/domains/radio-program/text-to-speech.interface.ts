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

// /**
//  * 音声ファイル生成結果
//  */
// export interface TextToSpeechResult {
//   /**
//    * 音声ファイルのパス
//    */
//   audioFilePath: string;
// }

/**
 * Text to speech interface
 */
export interface ITextToSpeechClient {
  /**
   * 番組の台本から音声ファイルを生成する
   * @param command 生成要求コマンド
   * @returns ヘッドライントピック番組音声ファイルの生成結果
   */
  generateHeadlineTopicProgramAudioFiles(
    command: HeadlineTopicProgramAudioFilesGenerateCommand,
  ): Promise<HeadlineTopicProgramAudioFilesGenerateResult>;
}
