/**
 * 生成した番組ファイルのアップロードを要求するコマンドのインターフェース
 */
export interface ProgramFileUploadCommand {
  /**
   * 番組ID
   */
  programId: string;

  /**
   * 番組日
   */
  programDate: Date;

  /**
   * アップロード先のクラウドストレージのバケット名
   */
  bucketName: string;

  /**
   * アップロード先のクラウドストレージのファイルパス
   */
  uploadPath: string;

  /**
   * アップロード対象のファイルパス
   */
  filePath: string;

  /**
   * アップロード対象のファイルのコンテンツタイプ
   */
  contentType?: string;
}

/**
 * 生成した番組ファイルをクラウドストレージにアップロードする機能のインターフェース
 */
export interface IProgramFileUploader {
  /**
   * 番組ファイルをアップロードする
   * @param command アップロード要求コマンド
   */
  upload(command: ProgramFileUploadCommand): Promise<string>;
}
