import { ErrorBase, ErrorOptions } from '@tech-post-cast/commons';

/**
 * ヘッドライントピック番組に関するエラーを表す基底クラス
 */
export class HeadlineTopicProgramError extends ErrorBase {
  override name = 'HeadlineTopicProgramError';
  constructor(message: string, options?: ErrorOptions) {
    super(message);
    this.cause = options?.cause;
  }
}

/**
 * ヘッドライントピック番組の取得に失敗したことを表すエラー
 */
export class HeadlineTopicProgramFindError extends HeadlineTopicProgramError {
  override name = 'HeadlineTopicProgramFindError';
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

/**
 * ヘッドライントピック番組の台本生成に失敗したことを表すエラー
 */
export class HeadlineTopicProgramGenerateScriptError extends HeadlineTopicProgramError {
  override name = 'HeadlineTopicProgramGenerateScriptError';
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}
