import { ErrorBase, ErrorOptions } from '@tech-post-cast/commons';

/**
 * パーソナルプログラム処理エラーを表す基底クラス
 */
export class PersonalizedProgramError extends ErrorBase {
  override name = 'PersonalizedProgramError';
  constructor(message: string, options?: ErrorOptions) {
    super(message);
    this.cause = options?.cause;
  }
}

/**
 * パーソナルプログラムが見つからない場合のエラー
 */
export class PersonalizedProgramNotFoundError extends PersonalizedProgramError {
  override name = 'PersonalizedProgramNotFoundError';
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

/**
 * パーソナルプログラムのデータベース操作エラー
 */
export class PersonalizedProgramDatabaseError extends PersonalizedProgramError {
  override name = 'PersonalizedProgramDatabaseError';
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

/**
 * パーソナルプログラムの取得エラー
 */
export class PersonalizedProgramRetrievalError extends PersonalizedProgramError {
  override name = 'PersonalizedProgramRetrievalError';
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}
