/**
 * アプリケーション設定のユーティリティ関数
 */

/**
 * 開発環境かどうかを判定する
 * @returns 開発環境の場合true
 */
export const isDevelopment = (): boolean => {
  const config = useRuntimeConfig();
  return config.public.environment === 'development';
};

/**
 * 本番環境かどうかを判定する
 * @returns 本番環境の場合true
 */
export const isProduction = (): boolean => {
  const config = useRuntimeConfig();
  return config.public.environment === 'production';
};

/**
 * 現在の環境設定を取得する
 * @returns 環境設定オブジェクト
 */
export const getEnvironmentInfo = (): {
  isDevelopment: boolean;
  isProduction: boolean;
  environment: string;
  apiUrl: string;
} => {
  const config = useRuntimeConfig();
  return {
    isDevelopment: isDevelopment(),
    isProduction: isProduction(),
    environment: config.public.environment as string,
    apiUrl: config.public.apiUrl as string,
  };
};
