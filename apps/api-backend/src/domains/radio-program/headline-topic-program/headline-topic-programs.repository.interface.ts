import { HeadlineTopicProgramWithQiitaPosts } from '@tech-post-cast/database';
import { HeadlineTopicProgramWithSimilarAndNeighbors } from '.';

/**
 * ヘッドライントピック番組リポジトリのインターフェイス
 */
export interface IHeadlineTopicProgramsRepository {
  /**
   * 指定 ID のヘッドライントピック番組を取得する
   * @param id ヘッドライントピック番組 ID
   * @returns ヘッドライントピック番組
   */
  findOne(id: string): Promise<HeadlineTopicProgramWithQiitaPosts>;

  /**
   * ヘッドライントピック番組の件数を取得する
   * @returns ヘッドライントピック番組の件数
   */
  count(): Promise<number>;

  /**
   * ヘッドライントピック番組を取得する
   * @param page ページ番号
   * @param limit 1 ページあたりの件数
   * @returns ヘッドライントピック番組一覧
   */
  find(
    page: number,
    limit: number,
  ): Promise<HeadlineTopicProgramWithQiitaPosts[]>;

  /**
   * ヘッドライントピック番組のID一覧を取得する
   * @returns ヘッドライントピック番組のID一覧
   */
  findIds(): Promise<string[]>;

  /**
   * 指定のヘッドライントピック番組と、その類似番組および、前後の日付の番組を取得する
   * @param id ヘッドライントピック番組 ID
   * @returns ヘッドライントピック番組と、その類似番組および、前後の日付の番組
   */
  findWithSimilarAndNeighbors(
    id: string,
  ): Promise<HeadlineTopicProgramWithSimilarAndNeighbors>;

  /**
   * 指定のヘッドライントピック番組に類似した番組を取得する
   * @param id ヘッドライントピック番組 ID
   * @returns 類似番組一覧
   */
  findSimilarPrograms(
    id: string,
  ): Promise<HeadlineTopicProgramWithQiitaPosts[]>;
}
