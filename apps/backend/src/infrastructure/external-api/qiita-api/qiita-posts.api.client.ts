import { AppConfigService } from '@/app-config/app-config.service';
import {
  AuthorFilterCondition,
  DateRangeFilterCondition,
  IQiitaPostsApiClient,
  QiitaFeedFilterOptions,
  TagFilterCondition,
} from '@/domains/qiita-posts/qiita-posts.api.client.interface';
import {
  IQiitaPostApiResponse,
  QiitaPostApiResponse,
} from '@domains/qiita-posts/qiita-posts.entity';
import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosError, AxiosInstance, isAxiosError } from 'axios';
import * as dayjs from 'dayjs';

/** Qiita API での日付フォーマット */
const DATE_FORMAT = 'YYYY-MM-DD';

/** 1ページあたりの記事数 */
const PER_PAGE_ITEMS = 100;

/** Qiita API からのレスポンスデータ */
type QiitaPostApiResponseData = {
  /** 現在のページ番号 */
  currentPage: number;
  /** 最大ページ数 */
  maxPage: number;
  /** ページ内の記事一覧 */
  posts: IQiitaPostApiResponse[];
};

@Injectable()
export class QiitaPostsApiClient implements IQiitaPostsApiClient {
  private readonly logger = new Logger(QiitaPostsApiClient.name);
  private apiClient: AxiosInstance;

  constructor(private readonly appConfig: AppConfigService) {}

  getApiClient(): AxiosInstance {
    if (this.apiClient) return this.apiClient;
    const token = this.appConfig.QiitaAccessToken;
    this.apiClient = axios.create({
      baseURL: 'https://qiita.com/api/v2',
      responseType: 'json',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    return this.apiClient;
  }

  /**
   * 指定期間内に投稿された記事一覧を取得する
   * @param from 期間開始日
   * @param to 期間終了日
   * @returns 記事一覧
   */
  async findQiitaPostsByDateRange(
    from: Date,
    to: Date,
  ): Promise<QiitaPostApiResponse[]> {
    this.logger.verbose(`QiitaPostsApiRepository.findQiitaPostsByDateRange`, {
      from,
      to,
    });
    let page = 1;
    let maxPage = 1;
    const posts: QiitaPostApiResponse[] = [];
    // 検索クエリを作成
    const fromText = dayjs(from).format(DATE_FORMAT);
    const toText = dayjs(to).format(DATE_FORMAT);
    const query = `created:>=${fromText} created:<=${toText}`;
    do {
      // Qiita APIを利用して指定期間内に投稿された記事一覧を取得する
      const response = await this.findQiitaPostsByPage(query, page);
      const responsePosts = response.posts;
      for (const post of responsePosts) {
        posts.push(new QiitaPostApiResponse(post));
      }
      maxPage = response.maxPage;
      page++;
    } while (page <= maxPage);
    return posts;
  }

  /**
   * パーソナライズされたフィード条件に基づいて記事を検索する
   * @param options フィルター条件オプション
   * @returns 条件に一致する記事一覧
   */
  async findQiitaPostsByPersonalizedFeed(
    options: QiitaFeedFilterOptions,
  ): Promise<QiitaPostApiResponse[]> {
    this.logger.verbose(
      `QiitaPostsApiClient.findQiitaPostsByPersonalizedFeed`,
      {
        options,
      },
    );

    // 検索クエリを構築
    const queryParts: string[] = [];

    // 日付範囲フィルターを追加
    if (options.dateRangeFilter) {
      const dateQuery = this.buildDateRangeQuery(options.dateRangeFilter);
      if (dateQuery) {
        queryParts.push(dateQuery);
      }
    }

    // タグフィルターを追加
    if (options.tagFilters && options.tagFilters.length > 0) {
      options.tagFilters.forEach((tagFilter) => {
        const tagQuery = this.buildTagQuery(tagFilter);
        if (tagQuery) {
          queryParts.push(tagQuery);
        }
      });
    }

    // 著者フィルターを追加
    if (options.authorFilters && options.authorFilters.length > 0) {
      options.authorFilters.forEach((authorFilter) => {
        const authorQuery = this.buildAuthorQuery(authorFilter);
        if (authorQuery) {
          queryParts.push(authorQuery);
        }
      });
    }

    // クエリが空の場合は空の配列を返す
    if (queryParts.length === 0) {
      return [];
    }

    // 最終的な検索クエリを作成
    const query = queryParts.join(' ');

    this.logger.debug(`検索クエリを作成しました: ${query}`);

    // ページングの設定
    const perPage = options.perPage || PER_PAGE_ITEMS;
    const startPage = options.page || 1;

    // API検索実行
    let page = startPage;
    let maxPage = 1;
    const posts: QiitaPostApiResponse[] = [];

    do {
      const response = await this.findQiitaPostsByPage(query, page, perPage);
      const responsePosts = response.posts;
      for (const post of responsePosts) {
        posts.push(new QiitaPostApiResponse(post));
      }
      maxPage = response.maxPage;
      page++;
    } while (page <= maxPage);
    this.logger.debug(`Qiita API から取得した記事数: ${posts.length} 件`);
    return posts;
  }

  /**
   * 指定されたタグを含む記事を検索する
   * @param tagNames タグ名のリスト
   * @param logicType 論理演算子（デフォルトはOR）
   * @returns 条件に一致する記事一覧
   */
  async findQiitaPostsByTags(
    tagNames: string[],
    logicType: 'AND' | 'OR' = 'OR',
  ): Promise<QiitaPostApiResponse[]> {
    this.logger.verbose(`QiitaPostsApiClient.findQiitaPostsByTags`, {
      tagNames,
      logicType,
    });

    const tagFilter: TagFilterCondition = {
      tagNames,
      logicType,
    };

    return this.findQiitaPostsByPersonalizedFeed({
      tagFilters: [tagFilter],
    });
  }

  /**
   * 指定された著者が投稿した記事を検索する
   * @param authorIds 著者IDのリスト
   * @returns 条件に一致する記事一覧
   */
  async findQiitaPostsByAuthors(
    authorIds: string[],
  ): Promise<QiitaPostApiResponse[]> {
    this.logger.verbose(`QiitaPostsApiClient.findQiitaPostsByAuthors`, {
      authorIds,
    });

    const authorFilter: AuthorFilterCondition = {
      authorIds,
      logicType: 'OR',
    };

    return this.findQiitaPostsByPersonalizedFeed({
      authorFilters: [authorFilter],
    });
  }

  /**
   * 指定期間内に投稿された記事一覧のうち、指定ページ目の記事一覧を取得する
   * @param query 検索クエリ
   * @param page ページ番号
   * @param perPage 1ページあたりの記事数
   * @returns 記事一覧
   */
  async findQiitaPostsByPage(
    query: string,
    page: number,
    perPage: number = PER_PAGE_ITEMS,
  ): Promise<QiitaPostApiResponseData> {
    this.logger.verbose(`QiitaPostsApiRepository.findQiitaPostsByPage`, {
      query,
      page,
      perPage,
    });
    // Qiita API 実行
    const params: { [key: string]: any } = {
      query,
      page,
      per_page: perPage,
    };

    this.logger.debug(
      { params },
      `Qiita API へ記事一覧取得のリクエストを送信します`,
    );
    try {
      const response = await this.getApiClient().get<IQiitaPostApiResponse[]>(
        '/items',
        {
          params,
        },
      );
      this.logger.debug(
        {
          params,
          headers: response.headers,
          // data: response.data,
        },
        `Qiita API から記事一覧取得のレスポンスを受信しました。`,
      );
      const totalCount = response.headers['total-count'];
      return {
        currentPage: page,
        maxPage: Math.ceil(totalCount / perPage),
        posts: response.data,
      };
    } catch (error) {
      if (isAxiosError(error)) {
        const axiosError = error as AxiosError;
        this.logger.error(`Qiita API からエラーが返却されました。`, {
          code: axiosError.code,
          errorMessage: axiosError.message,
          response: axiosError.response?.data,
          requestParams: params,
        });
      }
      throw error;
    }
  }

  /**
   * 日付範囲フィルター条件からクエリを構築する
   * @param dateRange 日付範囲フィルター条件
   * @returns 検索クエリ文字列
   * @private
   */
  private buildDateRangeQuery(dateRange: DateRangeFilterCondition): string {
    // daysAgoが指定されている場合
    if (dateRange.daysAgo) {
      const today = dayjs();
      const fromDate = today.subtract(dateRange.daysAgo, 'day');
      return `created:>=${fromDate.format(DATE_FORMAT)}`;
    }

    // from/toが指定されている場合
    const conditions: string[] = [];

    if (dateRange.from) {
      const fromText = dayjs(dateRange.from).format(DATE_FORMAT);
      conditions.push(`created:>=${fromText}`);
    }

    if (dateRange.to) {
      const toText = dayjs(dateRange.to).format(DATE_FORMAT);
      conditions.push(`created:<=${toText}`);
    }

    return conditions.join(' ');
  }

  /**
   * タグフィルター条件からクエリを構築する
   * @param tagFilter タグフィルター条件
   * @returns 検索クエリ文字列
   * @private
   */
  private buildTagQuery(tagFilter: TagFilterCondition): string {
    if (!tagFilter.tagNames || tagFilter.tagNames.length === 0) {
      return '';
    }

    // 複数のタグがある場合はカンマ区切りでグルーピング
    if (tagFilter.tagNames.length > 1) {
      // タグ名をカンマで連結
      const tagGroup = tagFilter.tagNames.join(',');
      return `tag:${tagGroup}`;
    }

    // 単一タグの場合
    return `tag:${tagFilter.tagNames[0]}`;
  }

  /**
   * 著者フィルター条件からクエリを構築する
   * @param authorFilter 著者フィルター条件
   * @returns 検索クエリ文字列
   * @private
   */
  private buildAuthorQuery(authorFilter: AuthorFilterCondition): string {
    if (!authorFilter.authorIds || authorFilter.authorIds.length === 0) {
      return '';
    }

    // 複数の著者がある場合はカンマ区切りでグルーピング
    if (authorFilter.authorIds.length > 1) {
      // 著者IDをカンマで連結
      const authorGroup = authorFilter.authorIds.join(',');
      return `user:${authorGroup}`;
    }

    // 単一著者の場合
    return `user:${authorFilter.authorIds[0]}`;
  }
}
