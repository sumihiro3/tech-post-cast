import { ErrorBase, ErrorOptions } from '@tech-post-cast/commons';

/**
 * パーソナルフィード処理エラーを表す基底クラス
 */
export class PersonalizedFeedError extends ErrorBase {
  override name = 'PersonalizedFeedError';
  constructor(message: string, options?: ErrorOptions) {
    super(message);
    this.cause = options?.cause;
  }
}

/**
 * パーソナルフィードが見つからない場合のエラー
 */
export class PersonalizedFeedNotFoundError extends PersonalizedFeedError {
  override name = 'PersonalizedFeedNotFoundError';
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}
