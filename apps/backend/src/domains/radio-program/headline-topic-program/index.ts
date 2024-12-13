export * from './headline-topic-program-maker';

/**
 * ヘッドライントピック番組の台本を表すインターフェイス
 */
export interface HeadlineTopicProgramScript {
  /**
   * タイトル
   */
  title: string;

  /**
   * イントロダクション
   */
  intro: string;

  /**
   * 紹介記事
   */
  posts: { summary: string }[];

  /**
   * エンディング
   */
  ending: string;
}

/**
 * ヘッドライントピック番組の生成結果を表すインターフェイス
 */
export interface HeadlineTopicProgramGenerateResult {
  /**
   * 音声ファイル名
   */
  audioFileName: string;
  /**
   * 音声ファイルのパス
   */
  audioFilePath: string;
  /**
   * 音声ファイルの長さ（ミリ秒）
   */
  audioDuration: number;
  /**
   * 動画ファイル名
   */
  videoFileName: string;
  /**
   * 動画ファイルのパス
   */
  videoFilePath: string;
  /**
   * 台本
   */
  script: HeadlineTopicProgramScript;
}

/**
 * 番組音声ファイル、動画ファイルのアップロード結果を表すインターフェイス
 */
export interface ProgramUploadResult {
  audioUrl: string;
  videoUrl: string;
}
