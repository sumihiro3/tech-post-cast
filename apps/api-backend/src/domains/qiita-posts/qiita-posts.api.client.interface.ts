import {
  QiitaPostApiResponse,
  QiitaPostsSearchResult,
} from './qiita-posts.entity';

export interface IQiitaPostsApiClient {
  /**
   * 著者、タグ、最小公開日を指定して記事を検索する
   * @param authors 著者名の配列
   * @param tags タグの配列
   * @param minPublishedAt 公開日の最小値
   * @param page ページ番号（1から始まる）
   * @param perPage 1ページあたりの件数
   * @returns 記事一覧と総件数を含む検索結果
   */
  findQiitaPosts(
    authors?: string[],
    tags?: string[],
    minPublishedAt?: string,
    page?: number,
    perPage?: number,
  ): Promise<QiitaPostsSearchResult>;

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
