/**
 * APIエラーレスポンスの型定義
 */
export interface ApiErrorResponse {
  message: string;
  statusCode?: number;
  error?: string;
  errors?: Record<string, string[]>;
}

/**
 * バリデーションエラーの型定義
 */
export interface ValidationError {
  field: string;
  message: string[];
}

/**
 * Axiosエラーを拡張した型定義
 */
export interface ApiError extends Error {
  response?: {
    data?: ApiErrorResponse;
    status: number;
    statusText: string;
    headers: Record<string, string>;
  };
  isAxiosError: boolean;
  code?: string;
}
