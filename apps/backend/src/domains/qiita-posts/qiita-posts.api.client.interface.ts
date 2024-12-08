import { QiitaPostApiResponse } from './qiita-posts.entity';

export interface IQiitaPostsApiClient {
  /**
   * 指定期間内に投稿された記事一覧を取得する
   * @param from 期間開始日
   * @param to 期間終了日
   * @returns 記事一覧
   */
  findQiitaPostsByDateRange(
    from: Date,
    to: Date,
  ): Promise<QiitaPostApiResponse[]>;
}
