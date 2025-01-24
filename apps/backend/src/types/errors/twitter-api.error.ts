import { ErrorBase, ErrorOptions } from '@tech-post-cast/commons';

/**
 * X (Twitter API) エラーを表す基底クラス
 */
export class TwitterApiError extends ErrorBase {
  override name = 'TwitterApiError';
  constructor(message: string, options?: ErrorOptions) {
    super(message);
    this.cause = options?.cause;
  }
}
