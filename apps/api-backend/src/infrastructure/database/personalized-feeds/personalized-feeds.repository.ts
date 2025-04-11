import {
  PersonalizedFeed,
  PersonalizedFeedsResult,
} from '@/domains/personalized-feeds/personalized-feeds.entity';
import { IPersonalizedFeedsRepository } from '@/domains/personalized-feeds/personalized-feeds.repository.interface';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaClientManager } from '@tech-post-cast/database';

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
   * 指定されたユーザーIDに紐づくパーソナライズフィードの一覧を取得する
   * @param userId ユーザーID
   * @param page ページ番号（1から始まる）
   * @param perPage 1ページあたりの件数
   * @returns パーソナライズフィード一覧と総件数
   */
  async findByUserId(
    userId: string,
    page: number = 1,
    perPage: number = 20,
  ): Promise<PersonalizedFeedsResult> {
    this.logger.debug('PersonalizedFeedsRepository.findByUserId called', {
      userId,
      page,
      perPage,
    });

    try {
      const client = this.prisma.getClient();

      // 総件数を取得
      const total = await client.personalizedFeed.count({
        where: {
          userId,
          isActive: true,
        },
      });

      // ページネーションを適用してフィード一覧を取得
      const skip = (page - 1) * perPage;
      const personalizedFeeds = await client.personalizedFeed.findMany({
        where: {
          userId,
          isActive: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
        skip,
        take: perPage,
      });

      // エンティティへ変換
      const feeds = personalizedFeeds.map((feed) => new PersonalizedFeed(feed));

      this.logger.debug('パーソナライズフィード一覧を取得しました', {
        userId,
        totalCount: total,
        retrievedCount: feeds.length,
      });

      return new PersonalizedFeedsResult(feeds, total);
    } catch (error) {
      const errorMessage = `パーソナライズフィード一覧の取得に失敗しました`;
      this.logger.error(errorMessage, {
        error,
        userId,
        page,
        perPage,
      });
      throw new Error(errorMessage);
    }
  }

  /**
   * 指定されたIDのパーソナライズフィードを取得する
   * @param id パーソナライズフィードID
   * @returns パーソナライズフィード、存在しない場合はnull
   */
  async findById(id: string): Promise<PersonalizedFeed | null> {
    this.logger.debug('PersonalizedFeedsRepository.findById called', { id });

    try {
      const client = this.prisma.getClient();
      const personalizedFeed = await client.personalizedFeed.findUnique({
        where: { id },
      });

      if (!personalizedFeed) {
        this.logger.debug(`パーソナライズフィード [${id}] は存在しません`);
        return null;
      }

      return new PersonalizedFeed(personalizedFeed);
    } catch (error) {
      const errorMessage = `パーソナライズフィードの取得に失敗しました`;
      this.logger.error(errorMessage, {
        error,
        id,
      });
      throw new Error(errorMessage);
    }
  }

  /**
   * パーソナライズフィードを新規作成する
   * @param feed 作成するパーソナライズフィードの情報
   * @returns 作成されたパーソナライズフィード
   */
  async create(
    feed: Omit<PersonalizedFeed, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<PersonalizedFeed> {
    this.logger.debug('PersonalizedFeedsRepository.create called', { feed });

    try {
      const client = this.prisma.getClient();

      // フィードの作成日時と更新日時を現在時刻に設定
      const now = new Date();

      // パーソナライズフィードを作成
      const createdFeed = await client.personalizedFeed.create({
        data: {
          ...feed,
          createdAt: now,
          updatedAt: now,
          // ID は自動生成 (prisma-client-manager で接頭辞付きID生成処理を実装済み)
        },
      });

      this.logger.debug(
        `パーソナライズフィード [${createdFeed.id}] を作成しました`,
        {
          feedId: createdFeed.id,
          userId: createdFeed.userId,
        },
      );

      return new PersonalizedFeed(createdFeed);
    } catch (error) {
      const errorMessage = `パーソナライズフィードの作成に失敗しました`;
      this.logger.error(errorMessage, {
        error,
        feed,
      });
      throw new Error(errorMessage);
    }
  }
}
