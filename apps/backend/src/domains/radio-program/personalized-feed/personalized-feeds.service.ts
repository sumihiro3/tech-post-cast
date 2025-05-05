import { AppConfigService } from '@/app-config/app-config.service';
import { qiitaPostSummarizeAgent } from '@/mastra/agents';
import {
  personalizedProgramScriptSchema,
  QiitaPost,
  qiitaPostSchema,
} from '@/mastra/schemas';
import { createPersonalizedProgramScriptGenerationWorkflow } from '@/mastra/workflows';
import {
  InsufficientPostsError,
  PersonalizeProgramError,
} from '@/types/errors';
import { IQiitaPostsRepository } from '@domains/qiita-posts/qiita-posts.repository.interface';
import { QiitaPostsApiClient } from '@infrastructure/external-api/qiita-api/qiita-posts.api.client';
import { createLogger } from '@mastra/core/logger';
import { Mastra } from '@mastra/core/mastra';
import { Workflow } from '@mastra/core/workflows';
import {
  Inject,
  Injectable,
  Logger,
  NotImplementedException,
} from '@nestjs/common';
import { PersonalizedFeedProgram } from '@prisma/client';
import { QiitaPostApiResponse } from '@tech-post-cast/commons';
import { PersonalizedFeedWithFilters } from '@tech-post-cast/database';
import { z } from 'zod';
import { PersonalizedFeedFilterMapper } from './personalized-feed-filter.mapper';
import { IPersonalizedFeedsRepository } from './personalized-feeds.repository.interface';

// パーソナルプログラム生成に必要な最小記事数
const MIN_POSTS_COUNT = 3;

@Injectable()
export class PersonalizedFeedsService {
  private readonly logger = new Logger(PersonalizedFeedsService.name);

  // Mastra インスタンス
  mastra: Mastra;

  constructor(
    private readonly appConfig: AppConfigService,
    private readonly filterMapper: PersonalizedFeedFilterMapper,
    @Inject('PersonalizedFeedsRepository')
    private readonly personalizedFeedsRepository: IPersonalizedFeedsRepository,
    @Inject('QiitaPostsRepository')
    private readonly qiitaPostsRepository: IQiitaPostsRepository,
    private readonly qiitaPostsApiClient: QiitaPostsApiClient,
  ) {
    // パーソナルフィード用番組台本生成ワークフローの設定
    const personalizedProgramWorkflow = new Workflow({
      name: 'personalizedProgramWorkflow',
      triggerSchema: z.object({
        userName: z.string().describe('ユーザー名'),
        posts: z.array(qiitaPostSchema).describe('記事のリスト'),
      }),
      mastra: new Mastra(),
      result: {
        schema: personalizedProgramScriptSchema,
      },
    });
    personalizedProgramWorkflow
      .step(createPersonalizedProgramScriptGenerationWorkflow)
      .commit();
    // Mastra インスタンスの初期化
    this.mastra = new Mastra({
      workflows: { personalizedProgramWorkflow },
      agents: { qiitaPostSummarizeAgent },
      logger: createLogger({
        name: 'TechPostCastBackend',
        level: 'info',
      }),
    });
  }

  /**
   * 指定ユーザーのアクティブなパーソナライズフィードに基づいた番組を生成する
   * @param userId ユーザー ID
   * @param programDate 番組日
   * @returns 生成した番組
   */
  async createProgramByUserId(
    userId: string,
    programDate: Date,
  ): Promise<void> {
    this.logger.debug(`PersonalizedFeedsService.createProgramByUserId called`, {
      userId,
      programDate,
    });
    try {
      // TODO ユーザーのアクティブなパーソナルフィード（番組設定）を取得する
      const feeds =
        await this.personalizedFeedsRepository.findActiveByUserId(userId);
      this.logger.debug(
        `ユーザー [${userId}] のアクティブなパーソナルフィードを取得しました`,
        { feeds },
      );
      if (feeds.length === 0) {
        this.logger.warn(
          `ユーザー [${userId}] のアクティブなパーソナルフィードが見つかりませんでした`,
          { userId },
        );
        return;
      }
      // TODO パーソナルフィードに合致した番組を生成する
      const program = await this.createPersonalizedFeedProgram(
        userId,
        feeds[0],
        programDate,
      );
      this.logger.debug(
        `ユーザー [${userId}] のアクティブなパーソナルフィードに基づいた番組を生成しました`,
      );
    } catch (error) {
      const errorMessage = `ユーザー [${userId}] のアクティブなパーソナルフィードに基づいた番組の生成中にエラーが発生しました`;
      this.logger.error(errorMessage, { error }, error.stack);
      throw new PersonalizeProgramError(errorMessage, { cause: error });
    }
  }

  /**
   * パーソナルフィードの設定に基づいた最新の番組を生成する
   * @param personalizedFeedId パーソナルフィードの ID
   * @param programDate 番組日
   * @returns 生成した番組
   */
  async createPersonalizedFeedProgram(
    userId: string,
    feed: PersonalizedFeedWithFilters,
    programDate: Date,
  ): Promise<PersonalizedFeedProgram> {
    this.logger.debug(
      `PersonalizedFeedsService.createPersonalizedFeedProgram called`,
      {
        feedId: feed.id,
        feedName: feed.name,
        programDate,
      },
    );
    // TODO パーソナルフィードの設定に合致した Qiita 記事を取得する
    const filter = this.filterMapper.buildQiitaFilterOptions(feed);
    const posts =
      await this.qiitaPostsApiClient.findQiitaPostsByPersonalizedFeed(filter);
    this.logger.debug(
      `パーソナルフィード [${feed.id}] に基づいた記事を取得しました`,
      {
        feedId: feed.id,
        feedName: feed.name,
        programDate,
        postsLength: posts.length,
        posts: posts.map((post) => ({
          id: post.id,
          title: post.title,
          likes: post.likes_count,
        })),
      },
    );
    const filteredPosts = this.filterPostsByLikesCount(posts, feed);
    // TODO 指定のパーソナルフィードの番組で扱っていない記事だけに絞り込む
    const notExistsPosts =
      await this.qiitaPostsRepository.findNotExistsPostsByPersonalizedFeedId(
        feed.id,
        filteredPosts,
      );
    if (notExistsPosts.length < MIN_POSTS_COUNT) {
      const errorMessage = `パーソナルフィード [${feed.id}] に基づいた番組の生成に必要な記事が見つかりませんでした`;
      this.logger.error(errorMessage, {
        feedId: feed.id,
        programDate,
        postsLength: notExistsPosts.length,
      });
      throw new InsufficientPostsError(errorMessage);
    }
    // 件数を制限する
    const limitedPosts = notExistsPosts.slice(0, MIN_POSTS_COUNT);
    this.logger.log(
      `パーソナルフィード [${feed.id}] に基づいた番組の生成を開始します`,
      {
        feedId: feed.id,
        feedName: feed.name,
        programDate,
        posts: limitedPosts.map((post) => ({
          id: post.id,
          title: post.title,
          likes: post.likes_count,
        })),
      },
    );
    // TODO 取得した記事を元に番組の台本を生成する
    const programScript = await this.generatePersonalizedProgramScript(
      programDate,
      userId,
      limitedPosts,
    );
    this.logger.log(
      `パーソナルフィード [${feed.id}] に基づいた番組の台本を生成しました`,
      {
        feedId: feed.id,
        feedName: feed.name,
        programDate,
        programScript,
      },
    );
    // TODO パーソナルフィード番組を生成する
    // TODO Not implemented yet
    throw new NotImplementedException(
      'createPersonalizedFeedProgram メソッドは未実装です。パーソナルフィードの設定に基づいた最新の番組を生成する処理を実装してください。',
    );
  }

  /**
   * 指定のQiita記事リストをいいね数でフィルタリングする
   * @param posts Qiita記事リスト
   * @param feed パーソナルフィード
   * @returns フィルタリングされたQiita記事リスト
   */
  filterPostsByLikesCount(
    posts: QiitaPostApiResponse[],
    feed: PersonalizedFeedWithFilters,
  ): QiitaPostApiResponse[] {
    this.logger.debug(
      `PersonalizedFeedsService.filterPostsByLikesCount called`,
      {
        feedId: feed.id,
        feedName: feed.name,
      },
    );
    const minLikesCount =
      feed.filterGroups[0].likesCountFilters[0].minLikes ?? 0;
    if (minLikesCount <= 0) return posts;
    return posts.filter((post) => post.likes_count >= minLikesCount);
  }

  /**
   * QiitaPostApiResponse から QiitaPost へ変換する
   * @param post QiitaPostApiResponse
   * @returns QiitaPost
   */
  convertToQiitaPost(post: QiitaPostApiResponse): QiitaPost {
    return {
      id: post.id,
      title: post.title,
      content: post.body,
      author: post.user.id,
      tags: post.tags.map((tag) => tag.name),
      createdAt: post.created_at,
    };
  }

  /**
   * パーソナル番組の台本生成を実行する
   * @param programDate 番組日
   * @param userName ユーザー名
   * @param posts Qiita記事リスト
   * @returns 生成された台本
   */
  async generatePersonalizedProgramScript(
    programDate: Date,
    userName: string,
    posts: QiitaPostApiResponse[],
  ) {
    this.logger.debug(
      `PersonalizedFeedsService.generatePersonalizedProgramScript called`,
      {
        programDate,
        userName,
        posts: posts.map((post) => ({
          id: post.id,
          title: post.title,
        })),
      },
    );
    try {
      const programPosts = posts.map((post) => this.convertToQiitaPost(post));
      // 件数を制限する

      const workflow = this.mastra.getWorkflow('personalizedProgramWorkflow');
      const run = workflow.createRun();
      // ワークフローを実行する
      const result = await run.start({
        triggerData: {
          userName,
          posts: programPosts,
          programDate,
        },
      });
      this.logger.debug(
        `番組台本生成ワークフロー実行結果: ${JSON.stringify(result.results)}`,
      );
      return result;
    } catch (error) {
      const errorMessage = `パーソナル番組の台本生成中にエラーが発生しました`;
      this.logger.error(errorMessage, { error }, error.stack);
      throw new PersonalizeProgramError(errorMessage, { cause: error });
    }
  }
}
