import { Injectable, LogLevel, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { storage } from './storage';

@Injectable()
export class CustomLoggerService implements LoggerService {
  constructor(private readonly config: ConfigService) {}

  /**
   * 現在のログレベル
   */
  currentLogLevel: LogLevel = this.config.get<LogLevel>('LOG_LEVEL') || 'debug';

  /**
   * 出力するログレベルが有効かどうかを判定する
   * @param level LogLevel
   * @returns 出力するログレベルが有効な場合は true、そうでなければ false
   */
  private isLogLevelEnabled(level: LogLevel) {
    const logLevels: LogLevel[] = ['debug', 'log', 'warn', 'error'];
    return logLevels.indexOf(level) >= logLevels.indexOf(this.currentLogLevel);
  }

  /** JSON形式に整形して標準出力に出力 */
  private write(level: LogLevel, ...args: unknown[]) {
    if (!this.isLogLevelEnabled(level)) {
      return;
    }
    const time = new Date().toISOString();
    const context = args.pop(); // args の最後の要素にコンテキスト(ログを出力する処理クラス名など)が入る
    const message = args.shift(); // args の最初の要素をメッセージとする
    const params = args.length !== 0 ? args : undefined; // args の残りの要素をパラメータ(オプション)とする
    // AsyncLocalStorage から リクエストID を取得
    const requestId = storage.getStore();
    // JSON形式で標準出力に出力
    console.log(
      JSON.stringify({
        time,
        level: level.toUpperCase(),
        requestId,
        context,
        message,
        params,
      }),
    );
  }

  debug(...args: unknown[]) {
    this.write('debug', ...args);
  }

  log(...args: unknown[]) {
    this.write('log', ...args);
  }

  warn(...args: unknown[]) {
    this.write('warn', ...args);
  }

  error(...args: unknown[]) {
    this.write('error', ...args);
  }
}
