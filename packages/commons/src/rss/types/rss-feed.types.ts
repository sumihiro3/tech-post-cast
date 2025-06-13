/**
 * RSS フィードのメタデータ
 */
export interface RssFeedMetadata {
  /** フィードのタイトル */
  title: string;
  /** フィードの説明 */
  description: string;
  /** フィードのリンクURL */
  link: string;
  /** フィードの言語 */
  language: string;
  /** フィードの画像URL */
  imageUrl?: string;
  /** フィードの著者 */
  author?: string;
  /** フィードのカテゴリ */
  category?: string;
  /** 最終更新日時 */
  lastBuildDate: Date;
}

/**
 * RSS エピソードのメタデータ
 */
export interface RssEpisodeMetadata {
  /** エピソードのタイトル */
  title: string;
  /** エピソードの説明 */
  description: string;
  /** エピソードのリンクURL */
  link: string;
  /** 音声ファイルのURL */
  audioUrl: string;
  /** 音声ファイルのサイズ（バイト） */
  audioLength?: number;
  /** 音声ファイルの長さ（秒） */
  audioDuration: number;
  /** エピソードの公開日時 */
  pubDate: Date;
  /** エピソードの一意識別子 */
  guid: string;
  /** エピソードの画像URL */
  imageUrl?: string;
}

/**
 * RSS 生成のオプション
 */
export interface RssGenerationOptions {
  /** 最大エピソード数 */
  maxEpisodes?: number;
  /** ベースURL */
  baseUrl: string;
  /** RSS URL プレフィックス */
  rssUrlPrefix: string;
  /** デフォルトの番組画像URL */
  defaultImageUrl: string;
  /** 著者のメールアドレス */
  authorEmail?: string;
}

/**
 * RSS 生成の結果
 */
export interface RssGenerationResult {
  /** 生成されたRSS XML */
  xml: string;
  /** エピソード数 */
  episodeCount: number;
  /** 生成日時 */
  generatedAt: Date;
}
