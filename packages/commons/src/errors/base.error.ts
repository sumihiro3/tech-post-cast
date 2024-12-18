/**
 * エラーの基底クラス
 */
export abstract class ErrorBase extends Error {
  cause: unknown;
  constructor(message: string, options?: ErrorOptions) {
    super(message);
    this.cause = options?.cause;
  }
}

/**
 * エラー理由を表すオブジェクト
 */
export interface ErrorOptions {
  cause?: unknown;
}
