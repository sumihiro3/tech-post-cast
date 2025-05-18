import { ErrorBase, ErrorOptions } from '@tech-post-cast/commons';

/**
 * アプリケーションユーザー処理エラーを表す基底クラス
 */
export class AppUserError extends ErrorBase {
  override name = 'AppUserError';
  constructor(message: string, options?: ErrorOptions) {
    super(message);
    this.cause = options?.cause;
  }
}

/**
 * アプリケーションユーザーの取得に失敗した場合のエラー
 */
export class AppUserFindError extends AppUserError {
  override name = 'AppUserFindError';
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

/**
 * アプリケーションユーザーが見つからない場合のエラー
 */
export class AppUserNotFoundError extends AppUserError {
  override name = 'AppUserNotFoundError';
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}
