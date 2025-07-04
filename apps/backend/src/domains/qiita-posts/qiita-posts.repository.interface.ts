import { QiitaPost } from '@prisma/client';
import { QiitaPostApiResponse } from './qiita-posts.entity';

/**
 * Qiita 記事のリポジトリインターフェース
 */
export interface IQiitaPostsRepository {
  /**
   * 指定 ID の Qiita 記事を取得する
   * @param id Qiita 記事 ID
   * @returns Qiita 記事
   */
  findOne(id: string): Promise<QiitaPost | null>;

  // /**
  //  * 指定期間内に投稿された Qiita 記事を取得する
  //  * @param from 収集対象期間（From）
  //  * @param to 収集対象期間（To）
  //  * @returns Qiita 記事一覧
  //  */
  // findQiitaPostsByDateRange(from: Date, to: Date): Promise<QiitaPost[]>;

  /**
   * 指定の Qiita 記事一覧のうち、存在しない記事一覧を取得する
   * @param posts Qiita 記事 一覧
   * @returns 存在しない Qiita 記事一覧
   */
  findNotExistsPosts(
    posts: QiitaPostApiResponse[],
  ): Promise<QiitaPostApiResponse[]>;

  /**
   * Qiita 記事を新規登録または更新する
   * @param post 登録する Qiita 記事
   * @returns 登録した Qiita 記事
   */
  upsertQiitaPost(post: QiitaPostApiResponse): Promise<QiitaPost>;

  /**
   * 複数の Qiita 記事を新規登録または更新する
   * @param posts 登録する Qiita 記事一覧
   * @returns 登録した Qiita 記事一覧
   */
  upsertQiitaPosts(posts: QiitaPostApiResponse[]): Promise<QiitaPost[]>;

  /**
   * 指定 ID リストの Qiita 記事を本文も含めて取得する
   * @param ids Qiita 記事 ID リスト
   * @returns 本文を含むQiita記事リスト
   */
  findWithBodyByIds(ids: string[]): Promise<QiitaPost[]>;

  /**
   * 指定のQiita記事一覧から、指定のパーソナルフィードを基にしたパーソナルプログラムに紐づいていない Qiita 記事を取得する
   * @param personalizedFeedId パーソナルフィード ID
   * @param posts Qiita 記事一覧
   * @returns 指定のパーソナルフィードを基にしたパーソナルプログラムに紐づいていない Qiita 記事一覧
   */
  findNotExistsPostsByPersonalizedFeedId(
    personalizedFeedId: string,
    posts: QiitaPostApiResponse[],
  ): Promise<QiitaPostApiResponse[]>;
}

export const SYMBOL = Symbol('IQiitaPostsRepository');
