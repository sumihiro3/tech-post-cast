/**
 * ヘッドライントピック番組が見つからなかった場合のエラー
 */
export class HeadlineTopicProgramFindError extends Error {
  constructor(message: string, options?: unknown) {
    super(message);
    this.name = this.constructor.name;
    if (options && typeof options === 'object' && 'cause' in options) {
      Object.defineProperty(this, 'cause', {
        value: (options as { cause: unknown }).cause,
        configurable: true,
        writable: true,
      });
    }
  }
}
