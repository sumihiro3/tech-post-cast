import { ErrorBase, ErrorOptions } from '@tech-post-cast/commons';

/**
 * アプリ設定処理エラーを表す基底クラス
 */
export class AppConfigError extends ErrorBase {
  override name = 'AppConfigError';
  constructor(message: string, options?: ErrorOptions) {
    super(message);
    this.cause = options?.cause;
  }
}

/**
 * アプリ設定の検証エラーを表すクラス
 */
export class AppConfigValidationError extends AppConfigError {
  override name = 'AppConfigValidationError';
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}
