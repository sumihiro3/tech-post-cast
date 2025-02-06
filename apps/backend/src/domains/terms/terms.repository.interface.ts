import { Term } from '@prisma/client';

/**
 * 用語と読み方のペアを扱うリポジトリインターフェイス
 */
export interface ITermsRepository {
  /**
   * 用語と読み方のペアを取得する
   */
  find(): Promise<Term[]>;

  /**
   * 用語と読み方のペアを新規登録する
   * @param term 用語
   * @param reading 読み方
   * @returns 登録した用語と読み方のペア
   */
  create(term: string, reading: string): Promise<Term>;
}
