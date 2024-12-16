import { HeadlineTopicProgramWithQiitaPosts } from '@tech-post-cast/database';
/**
 * ヘッドライントピック番組のリポジトリインターフェース
 */
export interface IHeadlineTopicProgramsRepository {
  /**
   * 指定IDのヘッドライントピック番組を取得する
   * @param id ヘッドライントピック番組ID
   * @returns ヘッドライントピック番組
   */
  findById(id: string): Promise<HeadlineTopicProgramWithQiitaPosts | null>;
  /**
   * 最新のヘッドライントピック番組を取得する
   * @returns ヘッドライントピック番組
   */
  findLatest(): Promise<HeadlineTopicProgramWithQiitaPosts | null>;
}
