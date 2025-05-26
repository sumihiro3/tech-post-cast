import { Term } from '@prisma/client';

/**
 * 用語と読み方のペアのモックデータを作成するファクトリークラス
 */
export class TermFactory {
  /**
   * 単一の用語と読み方のペアモックデータを作成する
   * @param overrides 上書きするプロパティ
   * @returns Term
   */
  static createTerm(overrides: Partial<Term> = {}): Term {
    return {
      id: 1,
      term: 'agile',
      reading: 'あじゃいる',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      ...overrides,
    };
  }

  /**
   * 複数の用語と読み方のペアモックデータを作成する
   * @param count 作成する用語数
   * @param overrides 上書きするプロパティ
   * @returns Term[]
   */
  static createTerms(
    count: number,
    overrides: Partial<Term> = {},
  ): Term[] {
    return Array.from({ length: count }, (_, index) =>
      this.createTerm({
        id: index + 1,
        term: `term-${index + 1}`,
        reading: `reading-${index + 1}`,
        ...overrides,
      }),
    );
  }
}
