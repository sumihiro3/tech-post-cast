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
 * アプリケーションユーザーの新規登録に失敗した場合のエラー
 */
export class AppUserCreateError extends AppUserError {
  override name = 'AppUserCreateError';
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

/**
 * アプリケーションユーザーの更新に失敗した場合のエラー
 */
export class AppUserUpdateError extends AppUserError {
  override name = 'AppUserUpdateError';
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

/**
 * アプリケーションユーザーの削除に失敗した場合のエラー
 */
export class AppUserDeleteError extends AppUserError {
  override name = 'AppUserDeleteError';
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

/**
 * ユーザーが存在しない場合に発生するエラー
 */
export class UserNotFoundError extends AppUserError {
  override name = 'UserNotFoundError';
  constructor(userId: string, cause?: unknown) {
    super(`ユーザー [${userId}] は登録されていません`, cause);
  }
}
