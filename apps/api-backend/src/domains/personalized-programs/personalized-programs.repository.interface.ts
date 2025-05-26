import { PersonalizedFeedProgramWithDetails } from '@tech-post-cast/database';

export interface PaginationOptions {
  limit: number;
  offset: number;
  orderBy?: {
    [key: string]: 'asc' | 'desc';
  };
}

export interface PersonalizedProgramsResult {
  programs: PersonalizedFeedProgramWithDetails[];
  totalCount: number;
}

/**
 * パーソナルプログラムリポジトリのインターフェース
 */
export interface IPersonalizedProgramsRepository {
  /**
   * 指定ユーザーのパーソナルプログラム一覧をページネーション付きで取得する
   * @param userId ユーザーID
   * @param options ページネーションオプション
   * @returns パーソナルプログラム一覧と総件数
   */
  findByUserIdWithPagination(
    userId: string,
    options: PaginationOptions,
  ): Promise<PersonalizedProgramsResult>;

  /**
   * 指定IDのパーソナルプログラムを取得する
   * @param id プログラムID
   * @returns パーソナルプログラム、存在しない場合はnull
   */
  findById(id: string): Promise<PersonalizedFeedProgramWithDetails | null>;
}
