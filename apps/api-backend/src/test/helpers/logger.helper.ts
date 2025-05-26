import { Logger } from '@nestjs/common';

/**
 * テスト実行時にログ出力を抑制するヘルパー関数
 * テストの前に呼び出すことで、テスト中のログ出力を抑制できる
 */
export function suppressLogOutput(): jest.SpyInstance[] {
  const spies = [
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined),
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined),
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined),
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined),
  ];
  return spies;
}

/**
 * suppressLogOutput()で抑制したログ出力を元に戻すヘルパー関数
 * テストの後に呼び出すことで、ログ出力の抑制を解除できる
 * @param spies suppressLogOutput()の戻り値
 */
export function restoreLogOutput(spies: jest.SpyInstance[]): void {
  spies.forEach((spy) => spy.mockRestore());
}

/**
 * テスト実行時にログ出力を抑制するためのJestのセットアップ関数
 * beforeEach/afterEachで使用する
 */
export function setupLogSuppression(): jest.SpyInstance[] {
  const spies = suppressLogOutput();
  return spies;
}

/**
 * テスト実行時にログ出力の抑制を解除するためのJestのティアダウン関数
 * beforeEach/afterEachで使用する
 * @param spies setupLogSuppression()の戻り値
 */
export function teardownLogSuppression(spies: jest.SpyInstance[]): void {
  restoreLogOutput(spies);
}
