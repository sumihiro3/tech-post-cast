import { HeadlineTopicProgram, ListenerLetter } from '@prisma/client';

/**
 * リスナーからのお便りのリポジトリインターフェース
 */
export interface IListenerLettersRepository {
  /**
   * 番組で未紹介のお便りを取得する
   * 送信日時が古い順に取得する
   * @returns 未紹介のお便り
   */
  findUnintroduced(): Promise<ListenerLetter>;

  /**
   * 指定の番組で紹介されたお便りを取得する
   * @param program 紹介された番組
   * @returns 紹介されたお便り
   */
  findIntroduced(program: HeadlineTopicProgram): Promise<ListenerLetter>;

  /**
   * 指定のお便りを紹介済みにする
   * @param letter 紹介済みにするお便り
   * @param お便りを紹介した番組
   */
  updateAsIntroduced(
    letter: ListenerLetter,
    program: HeadlineTopicProgram,
  ): Promise<void>;
}
