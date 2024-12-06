import { QiitaPost } from '@prisma/client';

/**
 * Qiita 記事のリポジトリインターフェース
 */
export interface IQiitaPostsRepository {
  /**
   * 指定 ID の Qiita 記事を取得する
   * @param id Qiita 記事 ID
   * @returns Qiita 記事
   */
  findOne(id: string): Promise<QiitaPost>;

  // /**
  //  * 指定期間内に投稿された Qiita 記事を取得する
  //  * @param from 収集対象期間（From）
  //  * @param to 収集対象期間（To）
  //  * @returns Qiita 記事一覧
  //  */
  // findQiitaPostsByDateRange(from: Date, to: Date): Promise<QiitaPost[]>;

  // /**
  //  * 指定の Qiita 記事一覧のうち、存在しない記事一覧を取得する
  //  * @param posts Qiita 記事 一覧
  //  * @returns 存在しない Qiita 記事一覧
  //  */
  // findNotExistsPosts(
  //   posts: QiitaPostApiResponse[],
  // ): Promise<QiitaPostApiResponse[]>;

  // /**
  //  * Qiita 記事を新規登録または更新する
  //  * @param item 登録する Qiita 記事
  //  * @returns 登録した Qiita 記事
  //  */
  // upsertQiitaPost(item: QiitaPostApiResponse): Promise<QiitaPost>;

  // /**
  //  * 複数の Qiita 記事を新規登録または更新する
  //  * @param items 登録する Qiita 記事一覧
  //  * @returns 登録した Qiita 記事一覧
  //  */
  // upsertQiitaPosts(items: QiitaPostApiResponse[]): Promise<QiitaPost[]>;
}

export const SYMBOL = Symbol('IQiitaPostsRepository');
