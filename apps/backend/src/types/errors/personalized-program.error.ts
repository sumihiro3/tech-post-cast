import { ErrorBase, ErrorOptions } from '@tech-post-cast/commons';

/**
 * パーソナルプログラム生成処理エラーを表す基底クラス
 */
export class PersonalizeProgramError extends ErrorBase {
  override name = 'PersonalizeProgramError';
  constructor(message: string, options?: ErrorOptions) {
    super(message);
    this.cause = options?.cause;
  }
}

/**
 * パーソナルプログラムの生成に必要な記事数が不足しているエラーを表すクラス
 */
export class InsufficientPostsError extends PersonalizeProgramError {
  override name = 'InsufficientPostsError';
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

/**
 * パーソナルプログラムの記事データ永続化エラー
 */
export class PersonalizedProgramPersistenceError extends PersonalizeProgramError {
  override name = 'PersonalizedProgramPersistenceError';
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

/**
 * パーソナルプログラムのファイルアップロードエラー
 */
export class PersonalizedProgramUploadError extends PersonalizeProgramError {
  override name = 'PersonalizedProgramUploadError';
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}
