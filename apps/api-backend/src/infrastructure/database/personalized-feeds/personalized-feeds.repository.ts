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
}
