import { Logger } from '@nestjs/common';

/**
 * テスト実行時のログ出力を抑制する
 * @returns 抑制したログ出力のスパイオブジェクト配列
 */
export function suppressLogOutput(): jest.SpyInstance[] {
  const logSpies: jest.SpyInstance[] = [];

  logSpies.push(
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined),
  );
  logSpies.push(
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined),
  );
  logSpies.push(
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined),
  );
  logSpies.push(
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined),
  );

  logSpies.push(jest.spyOn(console, 'log').mockImplementation(() => undefined));
  logSpies.push(
    jest.spyOn(console, 'debug').mockImplementation(() => undefined),
  );
  logSpies.push(
    jest.spyOn(console, 'warn').mockImplementation(() => undefined),
  );
  logSpies.push(
    jest.spyOn(console, 'error').mockImplementation(() => undefined),
  );

  return logSpies;
}

/**
 * 抑制したログ出力を復元する
 * @param logSpies suppressLogOutput()で取得したスパイオブジェクト配列
 */
export function restoreLogOutput(logSpies: jest.SpyInstance[]): void {
  logSpies.forEach((spy) => spy.mockRestore());
}
