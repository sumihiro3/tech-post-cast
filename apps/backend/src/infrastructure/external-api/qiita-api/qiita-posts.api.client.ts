import { IQiitaPostsApiClient } from '@/domains/qiita-posts/qiita-posts.api.client.interface';
import {
  IQiitaPostApiResponse,
  QiitaPostApiResponse,
} from '@domains/qiita-posts/qiita-posts.entity';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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

  constructor(private readonly configService: ConfigService) {}

  getApiClient(): AxiosInstance {
    if (this.apiClient) return this.apiClient;
    const token = this.configService.get('QIITA_API_ACCESS_TOKEN');
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
   * 指定期間内に投稿された記事一覧のうち、指定ページ目の記事一覧を取得する
   * @param targetYearMonth 収集対象年月
   * @param page ページ番号
   * @returns 記事一覧
   */
  async findQiitaPostsByPage(
    query: string,
    page: number,
  ): Promise<QiitaPostApiResponseData> {
    this.logger.verbose(`QiitaPostsApiRepository.findQiitaPostsByPage`, {
      query,
      page,
    });
    // Qiita API 実行
    const params = {
      query,
      page,
      per_page: PER_PAGE_ITEMS,
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
        maxPage: Math.ceil(totalCount / PER_PAGE_ITEMS),
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
}
