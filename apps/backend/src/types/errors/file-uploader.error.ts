import { ErrorBase, ErrorOptions } from '@tech-post-cast/commons';

/**
 * ファイルアップローダー処理エラーを表す基底クラス
 */
export class FileUploaderError extends ErrorBase {
  override name = 'FileUploaderError';
  constructor(message: string, options?: ErrorOptions) {
    super(message);
    this.cause = options?.cause;
  }
}
