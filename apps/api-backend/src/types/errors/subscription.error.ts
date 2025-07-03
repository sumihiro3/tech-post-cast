import { ErrorBase, ErrorOptions } from '@tech-post-cast/commons';

/**
 * プランが見つからない場合のエラー
 */
export class PlanNotFoundError extends ErrorBase {
  override name = 'PlanNotFoundError';
  constructor(message: string, options?: ErrorOptions) {
    super(message);
    this.cause = options?.cause;
  }
}
