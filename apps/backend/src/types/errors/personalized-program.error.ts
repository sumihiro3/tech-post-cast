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
 * パーソナルプログラムがすでに生成されているエラーを表すクラス
 */
export class PersonalizedProgramAlreadyExistsError extends PersonalizeProgramError {
  override name = 'PersonalizedProgramAlreadyExistsError';
  programDate: Date;
  constructor(message: string, programDate: Date, options?: ErrorOptions) {
    super(message, options);
    this.programDate = programDate;
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

/**
 * パーソナライズフィードを元に生成された番組の試行履歴の作成に失敗したエラー
 */
export class PersonalizedProgramAttemptPersistenceError extends PersonalizeProgramError {
  override name = 'PersonalizedProgramAttemptPersistenceError';
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

/**
 * パーソナライズプログラム通知データの取得に失敗したエラー
 */
export class PersonalizedProgramNotificationDataError extends PersonalizeProgramError {
  override name = 'PersonalizedProgramNotificationDataError';
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

/**
 * パーソナライズプログラム通知ステータスの更新に失敗したエラー
 */
export class PersonalizedProgramNotificationStatusUpdateError extends PersonalizeProgramError {
  override name = 'PersonalizedProgramNotificationStatusUpdateError';
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}
