import { IQiitaPostsApiClient } from '@/domains/qiita-posts/qiita-posts.api.client.interface';
import { QiitaPostsSearchResult } from '@/domains/qiita-posts/qiita-posts.entity';
import { Inject, Injectable, Logger } from '@nestjs/common';

@Injectable()
export class QiitaPostsService {
  private readonly logger = new Logger(QiitaPostsService.name);

  constructor(
    @Inject('IQiitaPostsApiClient')
    private readonly qiitaPostsApiClient: IQiitaPostsApiClient,
  ) {}

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
    this.logger.verbose('QiitaPostsService.findQiitaPosts', {
      authors,
      tags,
      minPublishedAt,
      page,
      perPage,
    });

    return this.qiitaPostsApiClient.findQiitaPosts(
      authors,
      tags,
      minPublishedAt,
      page,
      perPage,
    );
  }
}
