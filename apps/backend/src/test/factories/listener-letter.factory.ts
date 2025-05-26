import { ListenerLetter } from '@prisma/client';

/**
 * リスナーからのお便りのモックデータを作成するファクトリークラス
 */
export class ListenerLetterFactory {
  /**
   * 単一のお便りモックデータを作成する
   * @param overrides 上書きするプロパティ
   * @returns ListenerLetter
   */
  static createListenerLetter(overrides: Partial<ListenerLetter> = {}): ListenerLetter {
    return {
      id: 'letter-1',
      body: 'テストお便り本文',
      penName: 'テストユーザー',
      senderId: 'sender-1',
      sentAt: new Date('2023-01-01'),
      programId: null,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      ...overrides,
    };
  }

  /**
   * 複数のお便りモックデータを作成する
   * @param count 作成するお便り数
   * @param overrides 上書きするプロパティ
   * @returns ListenerLetter[]
   */
  static createListenerLetters(
    count: number,
    overrides: Partial<ListenerLetter> = {},
  ): ListenerLetter[] {
    return Array.from({ length: count }, (_, index) =>
      this.createListenerLetter({
        id: `letter-${index + 1}`,
        penName: `テストユーザー ${index + 1}`,
        ...overrides,
      }),
    );
  }
}
