import { AppConfigService } from '@/app-config/app-config.service';
import { IQiitaPostsApiClient } from '@/domains/qiita-posts/qiita-posts.api.client.interface';
import {
  IQiitaPostApiResponse,
  QiitaPostApiResponse,
  QiitaPostsSearchResult,
} from '@/domains/qiita-posts/qiita-posts.entity';
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
  /** 検索結果の総件数 */
  totalCount: number;
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
   * 著者、タグ、最小公開日を指定して記事を検索する
   * @param authors 著者名の配列
   * @param tags タグの配列
   * @param minPublishedAt 公開日の最小値
   * @param page ページ番号（1から始まる）
   * @param perPage 1ページあたりの件数
   * @returns 記事一覧と総件数を含む検索結果
   */
  async findQiitaPosts(
    authors?: string[],
    tags?: string[],
    minPublishedAt?: string,
    page: number = 1,
    perPage: number = 20,
  ): Promise<QiitaPostsSearchResult> {
    this.logger.verbose(`QiitaPostsApiClient.findQiitaPosts`, {
      authors,
      tags,
      minPublishedAt,
      page,
      perPage,
    });

    // クエリパラメータの構築（Qiitaの検索仕様に合わせて修正）
    // 複数の著者はカンマ区切りでグルーピングする
    const queryUsers =
      authors && authors.length > 0 ? `user:${authors.join(',')}` : null;

    // 複数のタグもカンマ区切りでグルーピングする
    const queryTags = tags && tags.length > 0 ? `tag:${tags.join(',')}` : null;

    // 公開日の最小値を追加
    const queryMinPublishedAt = minPublishedAt
      ? `created:>=${minPublishedAt}`
      : null;

    // クエリを作成する（設定された条件があれば、それらを組み合わせる）
    const query = [queryUsers, queryTags, queryMinPublishedAt]
      .filter(Boolean)
      .join(' ');

    // Qiita APIを利用して記事一覧を取得する（指定ページのみ）
    const response = await this.findQiitaPostsByPage(query, page, perPage);

    // QiitaPostsSearchResult形式でレスポンスを返す
    return {
      posts: response.posts.map((post) => new QiitaPostApiResponse(post)),
      totalCount: response.totalCount,
      page,
      perPage,
    };
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
    this.logger.verbose(`QiitaPostsApiClient.findQiitaPostsByDateRange`, {
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
   * 指定クエリに基づいて記事一覧のうち、指定ページ目の記事一覧を取得する
   * @param query 検索クエリ
   * @param page ページ番号
   * @param perPage 1ページあたりの件数
   * @returns 記事一覧
   */
  private async findQiitaPostsByPage(
    query: string,
    page: number,
    perPage: number = PER_PAGE_ITEMS,
  ): Promise<QiitaPostApiResponseData> {
    this.logger.verbose(`QiitaPostsApiClient.findQiitaPostsByPage`, {
      query,
      page,
      perPage,
    });
    // Qiita API 実行
    const params = {
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
        },
        `Qiita API から記事一覧取得のレスポンスを受信しました。`,
      );
      const totalCount = Number(response.headers['total-count'] || '0');
      return {
        currentPage: page,
        maxPage: Math.ceil(totalCount / perPage),
        posts: response.data,
        totalCount,
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
}
