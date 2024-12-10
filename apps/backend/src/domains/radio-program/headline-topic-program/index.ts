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
   * 長さ（ミリ秒）
   */
  duration: number;
  /**
   * 台本
   */
  script: HeadlineTopicProgramScript;
}
