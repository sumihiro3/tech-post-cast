import consola from 'consola';

/**
 * Logger を生成するプラグイン
 */
export default defineNuxtPlugin((/* nuxtApp */) => {
  const runtimeConfig = useRuntimeConfig();
  const strLogLevel = (runtimeConfig.public.LOG_LEVEL as string).toUpperCase();
  // デプロイすると Consola の Enum LogLevel が読み込めないエラーがでるため
  // LogLevel に対応した数値を直接設定する。
  let level = 4; // Debug
  switch (strLogLevel) {
    case 'INFO':
      level = 3;
      break;
    case 'WARN':
    case 'WARNING':
      level = 1;
      break;
    case 'ERROR':
      level = 0;
      break;
  }
  const logger = consola;
  logger.level = level;
  consola.debug(`Log level: ${level}: ${strLogLevel}`);

  return {
    provide: {
      logger,
    },
  };
});
