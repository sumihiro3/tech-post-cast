import type { ApiErrorResponse } from './errors';

/**
 * HTTP エラーの基底クラス
 */
export class HttpError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;

    // Error クラスを継承する際の TypeScript の制約に対処
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}

/**
 * 400 Bad Request エラー
 */
export class BadRequestError extends HttpError {
  constructor(message: string = 'リクエストが不正です') {
    super(message, 400);

    // Error クラスを継承する際の TypeScript の制約に対処
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}

/**
 * 401 Unauthorized エラー
 */
export class UnauthorizedError extends HttpError {
  constructor(message: string = '認証エラーが発生しました。再度ログインしてください') {
    super(message, 401);

    // Error クラスを継承する際の TypeScript の制約に対処
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

/**
 * 403 Forbidden エラー
 */
export class ForbiddenError extends HttpError {
  constructor(message: string = 'この操作を行う権限がありません') {
    super(message, 403);

    // Error クラスを継承する際の TypeScript の制約に対処
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

/**
 * 404 Not Found エラー
 */
export class NotFoundError extends HttpError {
  constructor(message: string = 'リソースが見つかりませんでした') {
    super(message, 404);

    // Error クラスを継承する際の TypeScript の制約に対処
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * 422 Unprocessable Entity エラー (バリデーションエラー)
 */
export class ValidationError extends HttpError {
  errors: Record<string, string[]>;

  constructor(
    message: string = 'リクエストデータが不正です',
    errors: Record<string, string[]> = {},
  ) {
    super(message, 422);
    this.errors = errors;

    // Error クラスを継承する際の TypeScript の制約に対処
    Object.setPrototypeOf(this, ValidationError.prototype);
  }

  /**
   * 特定のフィールドのエラーメッセージを取得
   */
  getFieldErrors(field: string): string[] {
    return this.errors[field] || [];
  }

  /**
   * すべてのエラーメッセージを連結して取得
   */
  getAllErrorMessages(): string {
    return Object.entries(this.errors)
      .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
      .join('\n');
  }

  /**
   * フィールドにエラーがあるかどうかを判定
   */
  hasFieldError(field: string): boolean {
    return !!this.errors[field] && this.errors[field].length > 0;
  }
}

/**
 * 500 Internal Server Error エラー
 */
export class InternalServerError extends HttpError {
  constructor(message: string = 'サーバーエラーが発生しました') {
    super(message, 500);

    // Error クラスを継承する際の TypeScript の制約に対処
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}

/**
 * 429 Too Many Requests エラー
 */
export class TooManyRequestsError extends HttpError {
  constructor(
    message: string = 'リクエストが多すぎます。しばらく時間をおいてから再試行してください',
  ) {
    super(message, 429);

    // Error クラスを継承する際の TypeScript の制約に対処
    Object.setPrototypeOf(this, TooManyRequestsError.prototype);
  }
}

/**
 * API レスポンスからエラーを作成するユーティリティ関数
 */
export function createErrorFromApiResponse(
  statusCode: number,
  apiErrorResponse?: ApiErrorResponse,
): HttpError {
  // API レスポンスがない場合は、ステータスコードに基づいてデフォルトのエラーを作成
  if (!apiErrorResponse) {
    return createErrorFromStatusCode(statusCode);
  }

  const { message, errors } = apiErrorResponse;

  switch (statusCode) {
    case 400:
      return new BadRequestError(message);
    case 401:
      return new UnauthorizedError(message);
    case 403:
      return new ForbiddenError(message);
    case 404:
      return new NotFoundError(message);
    case 422:
      return new ValidationError(message, errors);
    case 429:
      return new TooManyRequestsError(message);
    case 500:
    default:
      return new InternalServerError(message);
  }
}

/**
 * ステータスコードからエラーを作成するユーティリティ関数
 */
export function createErrorFromStatusCode(statusCode: number): HttpError {
  switch (statusCode) {
    case 400:
      return new BadRequestError();
    case 401:
      return new UnauthorizedError();
    case 403:
      return new ForbiddenError();
    case 404:
      return new NotFoundError();
    case 422:
      return new ValidationError();
    case 429:
      return new TooManyRequestsError();
    case 500:
    default:
      return new InternalServerError();
  }
}
