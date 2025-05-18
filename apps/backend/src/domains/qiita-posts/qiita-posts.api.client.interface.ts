import {
  FindQiitaPostApiResponseData,
  QiitaPostApiResponse,
} from './qiita-posts.entity';

/**
 * タグでフィルタリングするための条件
 */
export interface TagFilterCondition {
  /**
   * タグ名のリスト
   */
  tagNames: string[];
  /**
   * 論理演算子（デフォルトはOR）
   */
  logicType?: 'AND' | 'OR';
}

/**
 * 著者でフィルタリングするための条件
 */
export interface AuthorFilterCondition {
  /**
   * 著者IDのリスト
   */
  authorIds: string[];
  /**
   * 論理演算子（デフォルトはOR）
   */
  logicType?: 'AND' | 'OR';
}

/**
 * 日付範囲でフィルタリングするための条件
 */
export interface DateRangeFilterCondition {
  /**
   * 指定日数以内の記事を対象とする
   */
  daysAgo?: number;
  /**
   * 開始日（daysAgoが指定されている場合は無視される）
   */
  from?: Date;
  /**
   * 終了日（daysAgoが指定されている場合は無視される）
   */
  to?: Date;
}

/**
 * パーソナライズフィードのフィルター条件
 */
export interface QiitaFeedFilterOptions {
  /**
   * タグでのフィルタリング条件
   */
  tagFilters?: TagFilterCondition[];
  /**
   * 著者でのフィルタリング条件
   */
  authorFilters?: AuthorFilterCondition[];
  /**
   * 日付範囲でのフィルタリング条件
   */
  dateRangeFilter?: DateRangeFilterCondition;
  /**
   * 1ページあたりの記事数
   */
  perPage?: number;
  /**
   * ページ番号
   */
  page?: number;
}

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

  /**
   * パーソナライズされたフィード条件に基づいて記事を検索する
   * @param options フィルター条件オプション
   * @returns 条件に一致する記事一覧
   */
  findQiitaPostsByPersonalizedFeed(
    options: QiitaFeedFilterOptions,
  ): Promise<FindQiitaPostApiResponseData>;

  /**
   * 指定されたタグを含む記事を検索する
   * @param tagNames タグ名のリスト
   * @param logicType 論理演算子（デフォルトはOR）
   * @returns 条件に一致する記事一覧
   */
  findQiitaPostsByTags(
    tagNames: string[],
    logicType?: 'AND' | 'OR',
  ): Promise<FindQiitaPostApiResponseData>;

  /**
   * 指定された著者が投稿した記事を検索する
   * @param authorIds 著者IDのリスト
   * @returns 条件に一致する記事一覧
   */
  findQiitaPostsByAuthors(
    authorIds: string[],
  ): Promise<FindQiitaPostApiResponseData>;
}
