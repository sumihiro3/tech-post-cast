import { QiitaPostApiResponse } from '@/domains/qiita-posts/qiita-posts.entity';
import { HeadlineTopicProgramMaker } from '@/domains/radio-program/headline-topic-program/headline-topic-program-maker';
import { QiitaPostsRepository } from '@/infrastructure/database/qiita-posts/qiita-posts.repository';
import { QiitaPostsApiClient } from '@/infrastructure/external-api/qiita-api/qiita-posts.api.client';
import { Injectable, Logger } from '@nestjs/common';
import { HeadlineTopicProgram } from '@prisma/client';
import { getYesterday, subtractDays } from '@tech-post-cast/commons';

// 「ヘッドライントピック」番組に含める記事の期間
const DATE_RANGE = 3;
// 「ヘッドライントピック」番組に含める記事数
const POPULAR_POSTS_COUNT = 5;

@Injectable()
export class HeadlineTopicProgramsService {
  private readonly logger = new Logger(HeadlineTopicProgramsService.name);

  constructor(
    private readonly qiitaPostsRepository: QiitaPostsRepository,
    private readonly qiitaPostsApiClient: QiitaPostsApiClient,
    private readonly headlineTopicProgramMaker: HeadlineTopicProgramMaker,
  ) {}

  /**
   * 「ヘッドライントピック」番組を生成する
   * @param programDate 番組日
   */
  async createHeadlineTopicProgram(
    programDate: Date,
  ): Promise<HeadlineTopicProgram> {
    this.logger.debug(
      `DailyHeadlineTopicsService.createDailyHeadlineTopics called`,
    );
    try {
      // 記事の取得期間を算出
      const to = getYesterday(programDate);
      const from = subtractDays(to, DATE_RANGE);
      this.logger.debug(`記事の取得期間を算出しました`, {
        from: from,
        to: to,
      });
      // Qiita 記事を API で取得
      this.logger.log(`Qiita 記事の取得を開始します`);
      const posts = await this.qiitaPostsApiClient.findQiitaPostsByDateRange(
        from,
        to,
      );
      this.logger.debug(`${posts.length} 件の Qiita 記事を取得しました`);
      // DB に登録されていない記事を取得
      const notExistsPosts =
        await this.qiitaPostsRepository.findNotExistsPosts(posts);
      // 公開済みかつ、いいね数が多い記事を取得
      const popularPosts = await this.findPopularPosts(
        notExistsPosts,
        POPULAR_POSTS_COUNT,
      );
      this.logger.log(`いいね数が多い記事を取得しました`, {
        postIds: popularPosts.map((post) => post.id),
      });
      // 「ヘッドライントピック」番組を生成する
      this.logger.log(`「ヘッドライントピック」番組のファイル生成を開始します`);
      const program = await this.headlineTopicProgramMaker.generateProgram(
        programDate,
        popularPosts,
      );
      this.logger.debug(`「ヘッドライントピック」番組を生成しました`, {
        program,
      });
      return program;
    } catch (error) {
      this.logger.error(`エラーが発生しました`, error);
      // TODO: 独自エラークラスを作成してエラーハンドリングを行う
      throw error;
    }
  }

  /**
   * 指定の記事のうち、公開済みかつ、いいね数が多い記事を取得する
   * @param posts 記事一覧
   * @param count 取得する記事数
   * @returns いいね数が多い記事一覧
   */
  async findPopularPosts(
    posts: QiitaPostApiResponse[],
    count: number,
  ): Promise<QiitaPostApiResponse[]> {
    this.logger.verbose(`DailyHeadlineTopicsService.findPopularPosts called`, {
      posts,
      count,
    });
    // 公開済みかつ、いいね数が多い記事を取得
    const popularPosts = posts
      .filter((post) => !post.private)
      .sort((a, b) => b.likes_count - a.likes_count)
      .slice(0, count);
    return popularPosts;
  }
}
