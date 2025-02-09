import { ListenerLetter } from '@prisma/client';

/**
 * リスナーからのお便りのリポジトリインターフェース
 */
export interface IListenerLettersRepository {
  /**
   * 番組で未紹介のお便りを取得する
   * @returns 未紹介のお便り
   */
  findUnintroducedLetters(): Promise<ListenerLetter[]>;

  /**
   * 指定のお便りを紹介済みにする
   * @param letters 紹介済みにするお便り
   */
  updateIntroducedLetters(letters: ListenerLetter[]): Promise<void>;
}
