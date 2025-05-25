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

/**
 * ヘッドライントピック番組の生成に失敗したことを表すエラー
 */
export class HeadlineTopicProgramGenerateError extends HeadlineTopicProgramError {
  override name = 'HeadlineTopicProgramGenerateError';
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

/**
 * ヘッドライントピック番組の再生成に失敗したことを表すエラー
 */
export class HeadlineTopicProgramRegenerateError extends HeadlineTopicProgramError {
  override name = 'HeadlineTopicProgramRegenerateError';
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

/**
 * ヘッドライントピック番組の台本ベクトル化に失敗したことを表すエラー
 */
export class HeadlineTopicProgramVectorizeError extends HeadlineTopicProgramError {
  override name = 'HeadlineTopicProgramVectorizeError';
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

/**
 * 番組で紹介するお便りの取得に失敗したことを表すエラー
 */
export class ListenerLetterFindError extends HeadlineTopicProgramError {
  override name = 'ListenerLetterFindError';
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

/**
 * 番組で紹介するお便りの更新に失敗したことを表すエラー
 */
export class ListenerLetterUpdateError extends HeadlineTopicProgramError {
  override name = 'ListenerLetterUpdateError';
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}
