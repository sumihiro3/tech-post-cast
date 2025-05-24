import {
  PersonalizedProgramAttemptPersistenceError,
  PersonalizedProgramPersistenceError,
} from '@/types/errors';
import {
  PersonalizedProgramAudioGenerateResult,
  ProgramUploadResult,
} from '@domains/radio-program/personalized-feed';
import { IPersonalizedFeedsRepository } from '@domains/radio-program/personalized-feed/personalized-feeds.repository.interface';
import { Injectable, Logger } from '@nestjs/common';
import {
  AppUser,
  PersonalizedFeed,
  PersonalizedFeedProgram,
  PersonalizedProgramAttempt,
  Prisma,
  QiitaPost,
} from '@prisma/client';
import { addDays } from '@tech-post-cast/commons';
import {
  PersonalizedFeedWithFilters,
  PersonalizedProgramAttemptFailureReason,
  PersonalizedProgramAttemptStatus,
  PrismaClientManager,
  UserWithSubscription,
} from '@tech-post-cast/database';

/**
 * IPersonalizedFeedsRepository の実装
 * Prisma を利用してデータベースにアクセスする
 */
@Injectable()
export class PersonalizedFeedsRepository
  implements IPersonalizedFeedsRepository
{
  private readonly logger = new Logger(PersonalizedFeedsRepository.name);

  constructor(private readonly prisma: PrismaClientManager) {}

  /**
   * 指定 ID のパーソナルフィードを取得する
   * @param id パーソナルフィード ID
   * @returns パーソナルフィード
   */
  async findOne(id: string): Promise<PersonalizedFeedWithFilters> {
    this.logger.debug(`PersonalizedFeedsRepository.findOne called`, { id });
    const client = this.prisma.getClient();
    const result = await client.personalizedFeed.findUnique({
      where: { id },
      include: {
        user: true,
        filterGroups: {
          include: {
            tagFilters: true,
            authorFilters: true,
            dateRangeFilters: true,
            likesCountFilters: true,
          },
        },
      },
    });
    this.logger.debug(`指定のパーソナルフィード [${id}] を取得しました`, {
      result,
    });
    return result;
  }

  /**
   * 指定ユーザーのアクティブなパーソナルフィード一覧を取得する
   * @param user ユーザー
   * @returns アクティブなパーソナルフィード一覧
   */
  async findActiveByUser(
    user: AppUser,
  ): Promise<PersonalizedFeedWithFilters[]> {
    this.logger.debug(`PersonalizedFeedsRepository.findActiveByUser called`, {
      user,
    });
    const client = this.prisma.getClient();
    const result = await client.personalizedFeed.findMany({
      where: {
        userId: user.id,
        isActive: true,
      },
      include: {
        filterGroups: {
          include: {
            tagFilters: true,
            authorFilters: true,
            dateRangeFilters: true,
            likesCountFilters: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
    this.logger.debug(
      `指定ユーザーのアクティブなパーソナルフィード一覧を取得しました`,
      {
        userId: user,
        count: result.length,
      },
    );
    return result;
  }

  /**
   * アクティブなパーソナルフィード一覧を取得する
   * @returns アクティブなパーソナルフィード一覧
   */
  async findActive(): Promise<PersonalizedFeedWithFilters[]> {
    this.logger.debug(`PersonalizedFeedsRepository.findActive called`);
    const client = this.prisma.getClient();
    const result = await client.personalizedFeed.findMany({
      where: { isActive: true },
      include: {
        filterGroups: {
          include: {
            tagFilters: true,
            authorFilters: true,
            dateRangeFilters: true,
            likesCountFilters: true,
          },
        },
      },
    });
    return result;
  }

  /**
   * パーソナルフィードの件数を取得する
   * @returns パーソナルフィードの件数
   */
  async count(): Promise<number> {
    this.logger.debug(`PersonalizedFeedsRepository.count called`);
    const client = this.prisma.getClient();
    const result = await client.personalizedFeed.count();
    this.logger.debug(`パーソナルフィードの件数を取得しました`, {
      result,
    });
    return result;
  }

  /**
   * パーソナルフィード一覧を取得する
   * @param page ページ番号
   * @param limit 1ページあたりの件数
   * @returns パーソナルフィード一覧
   */
  async find(
    page: number,
    limit: number,
  ): Promise<PersonalizedFeedWithFilters[]> {
    this.logger.debug(`PersonalizedFeedsRepository.find called`, {
      page,
      limit,
    });

    // limit <= 0 の場合は全件を取得する
    if (limit <= 0) {
      limit = await this.count();
    }
    const client = this.prisma.getClient();
    const result = await client.personalizedFeed.findMany({
      take: limit,
      skip: (page - 1) * limit,
      include: {
        user: true,
        filterGroups: {
          include: {
            tagFilters: true,
            authorFilters: true,
            dateRangeFilters: true,
            likesCountFilters: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    this.logger.debug(`パーソナルフィード一覧を取得しました`, {
      count: result.length,
    });

    return result;
  }

  /**
   * パーソナライズプログラムを作成する
   * @param user ユーザー
   * @param feed パーソナルフィード
   * @param programDate 番組日
   * @param posts 記事一覧
   * @param generateResult 番組生成結果
   * @param uploadResult アップロード結果
   * @returns 作成されたパーソナライズプログラム
   */
  async createPersonalizedProgram(
    user: UserWithSubscription,
    feed: PersonalizedFeedWithFilters,
    programDate: Date,
    posts: QiitaPost[],
    generateResult: PersonalizedProgramAudioGenerateResult,
    uploadResult: ProgramUploadResult,
  ): Promise<PersonalizedFeedProgram> {
    this.logger.verbose(
      `PersonalizedFeedsRepository.createPersonalizedProgram called`,
      {
        userId: user.id,
        feedId: feed.id,
        programDate,
        postsCount: posts.length,
      },
    );

    try {
      // 番組の有効期限をプランに応じて設定する
      const programDuration = user.subscriptions[0].plan.programDuration;
      const expiresAt = addDays(new Date(), programDuration);
      // パーソナライズプログラムを作成する
      const client = this.prisma.getClient();
      const program = await client.personalizedFeedProgram.create({
        data: {
          userId: user.id,
          feedId: feed.id,
          title: generateResult.script.title,
          script: generateResult.script as unknown as Prisma.JsonValue,
          audioUrl: uploadResult.audioUrl,
          imageUrl: uploadResult.imageUrl || null,
          audioDuration: generateResult.audioDuration,
          chapters: generateResult.chapters as unknown as Prisma.JsonValue,
          isExpired: false,
          expiresAt,
          createdAt: programDate,
          updatedAt: programDate,
          // 記事との関連付け
          posts: {
            connect: posts.map((post) => ({ id: post.id })),
          },
        },
        include: {
          posts: true,
        },
      });

      this.logger.debug(`パーソナライズプログラムを作成しました`, {
        programId: program.id,
        userId: user.id,
        feedId: feed.id,
        postsCount: program.posts.length,
      });

      return program;
    } catch (error) {
      const errorMessage = `パーソナライズプログラムの作成に失敗しました`;
      this.logger.error(errorMessage, {
        error,
        userId: user.id,
        feedId: feed.id,
        programDate,
      });
      throw new PersonalizedProgramPersistenceError(errorMessage, {
        cause: error,
      });
    }
  }

  /**
   * 指定フィードで、指定日に生成された番組があるかどうかを確認する
   * @param feedId パーソナルフィードID
   * @param programDate 番組日
   * @returns 番組があるかどうか
   */
  async findProgramByFeedIdAndDate(
    feed: PersonalizedFeed,
    programDate: Date,
  ): Promise<boolean> {
    this.logger.debug(
      `PersonalizedFeedsRepository.findProgramByFeedIdAndDate called`,
      {
        feedId: feed.id,
        programDate,
      },
    );
    let result = false;
    try {
      const client = this.prisma.getClient();
      const program = await client.personalizedFeedProgram.findFirst({
        where: {
          feedId: feed.id,
          createdAt: programDate,
        },
      });
      result = program !== null;
    } catch (error) {
      const errorMessage = `パーソナルフィード [${feed.id}] に基づいた番組の生成に失敗しました`;
      this.logger.error(errorMessage, {
        error,
        feedId: feed.id,
        programDate,
      });
      throw new PersonalizedProgramPersistenceError(errorMessage, {
        cause: error,
      });
    }
    return result;
  }

  /**
   * パーソナライズフィードを元に生成された番組の成功の試行履歴を作成する
   * @param user ユーザー
   * @param feed パーソナルフィード
   * @param programDate 番組日
   * @param postCount 紹介記事数
   * @param programId 番組ID
   */
  async addPersonalizedProgramSuccessAttempt(
    user: AppUser,
    feed: PersonalizedFeedWithFilters,
    programDate: Date,
    postCount: number,
    programId: string,
  ): Promise<PersonalizedProgramAttempt> {
    this.logger.debug(
      `PersonalizedFeedsRepository.addPersonalizedProgramSuccessAttempt called`,
      {
        userId: user.id,
        feedId: feed.id,
        programDate,
        postCount,
        programId,
      },
    );
    try {
      const client = this.prisma.getClient();
      const result = await client.personalizedProgramAttempt.create({
        data: {
          userId: user.id,
          feedId: feed.id,
          status: PersonalizedProgramAttemptStatus.SUCCESS,
          postCount,
          programId,
          createdAt: programDate,
        },
      });
      this.logger.debug(
        `パーソナライズフィードを元に生成された番組の成功の試行履歴を作成しました`,
        {
          result,
        },
      );
      return result;
    } catch (error) {
      const errorMessage = `パーソナライズフィードを元に生成された番組の成功の試行履歴の作成に失敗しました`;
      this.logger.error(errorMessage, {
        error,
        userId: user.id,
        feedId: feed.id,
        programDate,
        postCount,
        programId,
      });
      throw new PersonalizedProgramAttemptPersistenceError(errorMessage, {
        cause: error,
      });
    }
  }

  /**
   * パーソナライズフィードを元に生成された番組の失敗の試行履歴を作成する
   * @param user ユーザー
   * @param feed パーソナルフィード
   * @param programDate 番組日
   * @param reason 失敗理由
   * @returns 試行履歴
   */
  async addPersonalizedProgramFailureAttempt(
    user: AppUser,
    feed: PersonalizedFeedWithFilters,
    programDate: Date,
    postCount: number,
    reason: PersonalizedProgramAttemptFailureReason,
  ): Promise<PersonalizedProgramAttempt> {
    this.logger.debug(
      `PersonalizedFeedsRepository.addPersonalizedProgramFailureAttempt called`,
      {
        userId: user.id,
        feedId: feed.id,
        programDate,
        postCount,
        reason,
      },
    );
    try {
      const client = this.prisma.getClient();
      const result = await client.personalizedProgramAttempt.create({
        data: {
          userId: user.id,
          feedId: feed.id,
          status: PersonalizedProgramAttemptStatus.FAILED,
          reason,
          postCount,
          createdAt: programDate,
        },
      });
      this.logger.debug(
        `パーソナライズフィードを元に生成された番組の失敗の試行履歴を作成しました`,
        {
          result,
        },
      );
      return result;
    } catch (error) {
      const errorMessage = `パーソナライズフィードを元に生成された番組の失敗の試行履歴の作成に失敗しました`;
      this.logger.error(errorMessage, {
        error,
        userId: user.id,
        feedId: feed.id,
        programDate,
        reason,
      });
      throw new PersonalizedProgramAttemptPersistenceError(errorMessage, {
        cause: error,
      });
    }
  }
}
