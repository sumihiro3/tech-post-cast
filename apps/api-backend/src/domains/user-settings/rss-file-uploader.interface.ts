/**
 * RSSファイルアップロード用のコマンド
 */
export interface RssFileUploadCommand {
  /** ユーザーID */
  userId: string;
  /** RSSトークン */
  rssToken: string;
  /** アップロード先のバケット名 */
  bucketName: string;
  /** アップロード先のファイルパス */
  uploadPath: string;
  /** アップロード対象のファイルパス */
  filePath: string;
  /** コンテンツタイプ */
  contentType?: string;
}

/**
 * RSSファイルアップロード結果
 */
export interface RssFileUploadResult {
  /** アップロードされたRSS URL */
  rssUrl: string;
  /** アップロード先のパス */
  uploadPath: string;
}

/**
 * RSSファイル削除用のコマンド
 */
export interface RssFileDeleteCommand {
  /** アップロード先のバケット名 */
  bucketName: string;
  /** 削除対象のファイルパス */
  filePath: string;
}

/**
 * RSSファイルアップロード機能のインターフェース
 */
export interface IRssFileUploader {
  /**
   * RSSファイルをアップロードする
   * @param command アップロード要求コマンド
   * @returns アップロード結果
   */
  upload(command: RssFileUploadCommand): Promise<RssFileUploadResult>;

  /**
   * RSSファイルを削除する
   * @param command 削除要求コマンド
   */
  delete(command: RssFileDeleteCommand): Promise<void>;
}
