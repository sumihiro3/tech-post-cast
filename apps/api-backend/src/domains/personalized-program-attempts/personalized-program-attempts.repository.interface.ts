import { PersonalizedProgramAttempt } from '@prisma/client';

export interface PaginationOptions {
  limit: number;
  offset: number;
  orderBy?: {
    [key: string]: 'asc' | 'desc';
  };
}

export interface PersonalizedProgramAttemptsResult {
  attempts: PersonalizedProgramAttempt[];
  totalCount: number;
}

/**
 * パーソナライズ番組生成試行履歴リポジトリのインターフェース
 */
export interface IPersonalizedProgramAttemptsRepository {
  /**
   * 指定フィードIDの番組生成試行履歴一覧をページネーション付きで取得する
   * @param feedId フィードID
   * @param options ページネーションオプション
   * @returns 番組生成試行履歴一覧と総件数
   */
  findByFeedIdWithPagination(
    feedId: string,
    options: PaginationOptions,
  ): Promise<PersonalizedProgramAttemptsResult>;

  /**
   * 指定フィードIDの番組生成試行履歴の総件数を取得する
   * @param feedId フィードID
   * @returns 総件数
   */
  countByFeedId(feedId: string): Promise<number>;

  /**
   * 指定ユーザーIDの番組生成試行履歴一覧をページネーション付きで取得する
   * @param userId ユーザーID
   * @param options ページネーションオプション
   * @returns 番組生成試行履歴一覧と総件数
   */
  findByUserIdWithPagination(
    userId: string,
    options: PaginationOptions,
  ): Promise<PersonalizedProgramAttemptsResult>;

  /**
   * 指定IDの番組生成試行履歴を取得する
   * @param id 試行履歴ID
   * @returns 番組生成試行履歴、存在しない場合はnull
   */
  findById(id: string): Promise<PersonalizedProgramAttempt | null>;
}
