import { AppConfigService } from '@/app-config/app-config.service';
import { qiitaPostSummarizeAgent } from '@/mastra/agents';
import {
  PersonalizedProgramScript,
  personalizedProgramScriptSchema,
  QiitaPost,
  qiitaPostSchema,
} from '@/mastra/schemas';
import {
  CREATE_GENERATE_SCRIPT_WORKFLOW,
  createPersonalizedProgramScriptGenerationWorkflow,
} from '@/mastra/workflows';
import {
  InsufficientPostsError,
  PersonalizeProgramError,
} from '@/types/errors';
import { IQiitaPostsRepository } from '@domains/qiita-posts/qiita-posts.repository.interface';
import { QiitaPostsApiClient } from '@infrastructure/external-api/qiita-api/qiita-posts.api.client';
import { createLogger } from '@mastra/core/logger';
import { Mastra } from '@mastra/core/mastra';
import { Workflow } from '@mastra/core/workflows';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { QiitaPostApiResponse } from '@tech-post-cast/commons';
import { PersonalizedFeedWithFilters } from '@tech-post-cast/database';
import { z } from 'zod';
import { PersonalizedProgramScriptGenerationResult } from '.';
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
      // ユーザーのアクティブなパーソナルフィード（番組設定）を取得する
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
      // パーソナルフィードに合致した番組を生成する
      // TODO アクティブなパーソナルフィードが複数ある場合、すべてのフィードに基づいて番組を生成する
      await this.buildProgram(userId, feeds[0], programDate);
    } catch (error) {
      const errorMessage = `ユーザー [${userId}] のアクティブなパーソナルフィードに基づいた番組の生成中にエラーが発生しました`;
      this.logger.error(errorMessage, { error }, error.stack);
      throw new PersonalizeProgramError(errorMessage, { cause: error });
    }
  }

  /**
   * 指定ユーザーのアクティブなパーソナルフィードに基づいた番組を生成する
   * @param userId ユーザーID
   * @param feed パーソナルフィード
   * @param programDate 番組日
   */
  async buildProgram(
    userId: string,
    feed: PersonalizedFeedWithFilters,
    programDate: Date,
  ) {
    this.logger.debug(`PersonalizedFeedsService.buildProgram called`, {
      userId,
      feedId: feed.id,
      programDate,
    });
    // 番組台本の生成
    const { script, posts } = await this.generatePersonalizedProgramScript(
      userId,
      feed,
      programDate,
    );
    // TODO 番組音声ファイルの生成する
    // TODO 番組音声ファイルを S3 にアップロードする
    // TODO DB に番組での紹介記事を登録する
    // TODO DB にパーソナルプログラムを登録する
    this.logger.debug(
      `ユーザー [${userId}] のアクティブなパーソナルフィード [${feed.id}] に基づいた番組を生成しました`,
      { script },
    );
  }

  /**
   * パーソナルフィードの設定に基づいた番組の台本を生成する
   * @param personalizedFeedId パーソナルフィードの ID
   * @param programDate 番組日
   * @returns 生成した番組の台本
   */
  async generatePersonalizedProgramScript(
    userId: string,
    feed: PersonalizedFeedWithFilters,
    programDate: Date,
  ): Promise<PersonalizedProgramScriptGenerationResult> {
    this.logger.debug(
      `PersonalizedFeedsService.generatePersonalizedProgramScript called`,
      {
        feedId: feed.id,
        feedName: feed.name,
        programDate,
      },
    );
    // パーソナルフィードの設定に合致した Qiita 記事を取得する
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
    // 指定のパーソナルフィードの番組で扱っていない記事だけに絞り込む
    const notExistsPosts =
      await this.qiitaPostsRepository.findNotExistsPostsByPersonalizedFeedId(
        feed.id,
        filteredPosts,
      );
    if (notExistsPosts.length < MIN_POSTS_COUNT) {
      const errorMessage = `パーソナルフィード [${feed.id}] に基づいた番組台本の生成に必要な記事が見つかりませんでした`;
      this.logger.error(errorMessage, {
        feedId: feed.id,
        feedName: feed.name,
        programDate,
        postsLength: notExistsPosts.length,
      });
      throw new InsufficientPostsError(errorMessage);
    }
    // 番組で紹介する記事の件数を制限する
    const limitedPosts = notExistsPosts.slice(0, MIN_POSTS_COUNT);
    this.logger.log(
      `パーソナルフィード [${feed.id}] に基づいた番組台本の生成を開始します`,
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
    // 紹介対象記事を元に番組の台本生成フローを実行する
    const script = await this.runPersonalizedProgramScriptGenerationWorkflow(
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
        script: script,
        posts: limitedPosts.map((post) => ({
          id: post.id,
          title: post.title,
          likes: post.likes_count,
        })),
      },
    );
    return {
      script,
      posts: limitedPosts,
    };
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
   * パーソナル番組の台本生成ワークフローを実行する
   * @param programDate 番組日
   * @param userName ユーザー名
   * @param posts Qiita記事リスト
   * @returns 生成された台本
   */
  async runPersonalizedProgramScriptGenerationWorkflow(
    programDate: Date,
    userName: string,
    posts: QiitaPostApiResponse[],
  ): Promise<PersonalizedProgramScript> {
    this.logger.debug(
      `PersonalizedFeedsService.runPersonalizedProgramScriptGenerationWorkflow called`,
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
      // ワークフローの取得
      const workflow = this.mastra.getWorkflow('personalizedProgramWorkflow');
      const run = workflow.createRun();
      const programPosts = posts.map((post) => this.convertToQiitaPost(post));
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
      const workflowName = CREATE_GENERATE_SCRIPT_WORKFLOW;
      const workflowResultStatus = result.results[workflowName].status;
      if (workflowResultStatus !== 'success') {
        const errorMessage = `パーソナルプログラムの台本生成ワークフローが失敗しました`;
        this.logger.error(errorMessage, { result });
        throw new PersonalizeProgramError(errorMessage);
      }
      const generatedScript = result.results[workflowName].output
        ?.scriptGenerationWorkflowResult as PersonalizedProgramScript;
      this.logger.debug(`パーソナル番組の台本生成が完了しました`, {
        generatedScript,
      });
      return generatedScript;
    } catch (error) {
      const errorMessage = `パーソナル番組の台本生成中にエラーが発生しました`;
      this.logger.error(errorMessage, { error }, error.stack);
      throw new PersonalizeProgramError(errorMessage, { cause: error });
    }
  }
}
