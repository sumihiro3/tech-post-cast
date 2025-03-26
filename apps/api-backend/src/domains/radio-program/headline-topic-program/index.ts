import { HeadlineTopicProgramWithQiitaPosts } from '@tech-post-cast/database';

/**
 * ヘッドライントピック番組とその類似番組および前後の番組
 */
export interface HeadlineTopicProgramWithSimilarAndNeighbors {
  /**
   * 類似のヘッドライントピック番組
   */
  similar: HeadlineTopicProgramWithQiitaPosts[];

  /**
   * 前日のヘッドライントピック番組
   */
  previous?: HeadlineTopicProgramWithQiitaPosts;

  /**
   * 指定のヘッドライントピック番組
   */
  target: HeadlineTopicProgramWithQiitaPosts;

  /**
   * 翌日のヘッドライントピック番組
   */
  next?: HeadlineTopicProgramWithQiitaPosts;
}

/**
 * ヘッドライントピック番組の台本で使用される投稿の要約
 */
export interface PostSummary {
  /**
   * 投稿の要約
   */
  summary: string;
}

/**
 * ヘッドライントピック番組生成結果のチャプター定義
 */
export interface HeadlineTopicProgramChapter {
  /**
   * タイトル
   */
  title: string;

  /**
   * 開始時間(ms)
   */
  startTime: number;

  /**
   * 終了時間(ms)
   */
  endTime: number;
}

/**
 * ヘッドライントピック番組生成結果の台本
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
   * 紹介する記事
   */
  posts: PostSummary[];

  /**
   * エンディング
   */
  ending: string;
}

/**
 * ヘッドライントピック番組生成結果
 */
export interface HeadlineTopicProgramGenerateResult {
  /**
   * 台本
   */
  script: HeadlineTopicProgramScript;

  /**
   * チャプター定義
   */
  chapters: HeadlineTopicProgramChapter[];

  /**
   * 音声ファイルパス
   */
  audioPath: string;

  /**
   * 音声ファイルの長さ（ミリ秒）
   */
  audioDuration: number;

  /**
   * 動画ファイルパス
   */
  videoPath?: string;

  /**
   * 画像ファイルパス
   */
  imagePath?: string;
}

/**
 * 番組ファイルのアップロード結果
 */
export interface ProgramUploadResult {
  /**
   * 音声ファイルURL
   */
  audioUrl: string;

  /**
   * 動画ファイルURL
   */
  videoUrl?: string;

  /**
   * 画像ファイルURL
   */
  imageUrl?: string;
}
