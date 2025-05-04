import { PersonalizedFeedWithFilters } from '@tech-post-cast/database';

/**
 * パーソナルフィードのリポジトリインターフェイス
 */
export interface IPersonalizedFeedsRepository {
  /**
   * 指定 ID のパーソナルフィードを取得する
   * @param id パーソナルフィード ID
   * @returns パーソナルフィード
   */
  findOne(id: string): Promise<PersonalizedFeedWithFilters>;

  /**
   * 指定ユーザーのアクティブなパーソナルフィード一覧を取得する
   * @param userId ユーザーID
   * @returns アクティブなパーソナルフィード一覧
   */
  findActiveByUserId(userId: string): Promise<PersonalizedFeedWithFilters[]>;

  /**
   * パーソナルフィードの件数を取得する
   * @returns パーソナルフィードの件数
   */
  count(): Promise<number>;

  /**
   * パーソナルフィード一覧を取得する
   * @param page ページ番号
   * @param limit 1ページあたりの件数
   * @returns パーソナルフィード一覧
   */
  find(page: number, limit: number): Promise<PersonalizedFeedWithFilters[]>;
}
