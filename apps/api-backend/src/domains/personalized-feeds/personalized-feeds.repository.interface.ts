import {
  PersonalizedFeed,
  PersonalizedFeedsResult,
} from './personalized-feeds.entity';

/**
 * パーソナライズフィードリポジトリのインターフェース
 */
export interface IPersonalizedFeedsRepository {
  /**
   * 指定されたユーザーIDに紐づくパーソナライズフィードの一覧を取得する
   * @param userId ユーザーID
   * @param page ページ番号（1から始まる）
   * @param perPage 1ページあたりの件数
   * @returns パーソナライズフィード一覧と総件数
   */
  findByUserId(
    userId: string,
    page?: number,
    perPage?: number,
  ): Promise<PersonalizedFeedsResult>;

  /**
   * 指定されたIDのパーソナライズフィードを取得する
   * @param id パーソナライズフィードID
   * @returns パーソナライズフィード、存在しない場合はnull
   */
  findById(id: string): Promise<PersonalizedFeed | null>;
}
