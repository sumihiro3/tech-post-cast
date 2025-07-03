/**
 * RSS関連のベースエラークラス
 */
export abstract class RssError extends Error {
  abstract override name: string;
  cause?: unknown;

  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    if (options?.cause) {
      this.cause = options.cause;
    }
  }
}

/**
 * RSSファイル生成エラー
 */
export class RssFileGenerationError extends RssError {
  override name = 'RssFileGenerationError';
}

/**
 * RSSファイルアップロードエラー
 */
export class RssFileUploadError extends RssError {
  override name = 'RssFileUploadError';
}
