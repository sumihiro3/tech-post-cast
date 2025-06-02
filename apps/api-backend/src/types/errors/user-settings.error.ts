import { ErrorBase, ErrorOptions } from '@tech-post-cast/commons';

/**
 * ユーザー設定処理エラーを表す基底クラス
 */
export class UserSettingsError extends ErrorBase {
  override name = 'UserSettingsError';
  constructor(message: string, options?: ErrorOptions) {
    super(message);
    this.cause = options?.cause;
  }
}

/**
 * ユーザー設定が見つからない場合のエラー
 */
export class UserSettingsNotFoundError extends UserSettingsError {
  override name = 'UserSettingsNotFoundError';
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

/**
 * ユーザー設定の取得処理でエラーが発生した場合
 */
export class UserSettingsRetrievalError extends UserSettingsError {
  override name = 'UserSettingsRetrievalError';
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

/**
 * ユーザー設定の更新処理でエラーが発生した場合
 */
export class UserSettingsUpdateError extends UserSettingsError {
  override name = 'UserSettingsUpdateError';
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

/**
 * Slack Webhook URLのテスト処理でエラーが発生した場合
 */
export class SlackWebhookTestError extends UserSettingsError {
  override name = 'SlackWebhookTestError';
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}
