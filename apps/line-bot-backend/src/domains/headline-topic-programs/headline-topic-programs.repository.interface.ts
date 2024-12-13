import { HeadlineTopicProgram } from '@prisma/client';
/**
 * ヘッドライントピック番組のリポジトリインターフェース
 */
export interface IHeadlineTopicProgramsRepository {
  /**
   * 最新のヘッドライントピック番組を取得する
   * @returns ヘッドライントピック番組
   */
  findLatest(): Promise<HeadlineTopicProgram | null>;
}
