import { IPersonalizedFeedsRepository } from '@domains/radio-program/personalized-feed/personalized-feeds.repository.interface';
import { Injectable, Logger } from '@nestjs/common';
import {
  PersonalizedFeedWithFilters,
  PrismaService,
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

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 指定 ID のパーソナルフィードを取得する
   * @param id パーソナルフィード ID
   * @returns パーソナルフィード
   */
  async findOne(id: string): Promise<PersonalizedFeedWithFilters> {
    this.logger.debug(`PersonalizedFeedsRepository.findOne called`, { id });
    const result = await this.prisma.personalizedFeed.findUnique({
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
   * @param userId ユーザーID
   * @returns アクティブなパーソナルフィード一覧
   */
  async findActiveByUserId(
    userId: string,
  ): Promise<PersonalizedFeedWithFilters[]> {
    this.logger.debug(`PersonalizedFeedsRepository.findActiveByUserId called`, {
      userId,
    });
    const result = await this.prisma.personalizedFeed.findMany({
      where: {
        userId,
        isActive: true,
      },
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
    this.logger.debug(
      `指定ユーザーのアクティブなパーソナルフィード一覧を取得しました`,
      {
        userId,
        count: result.length,
      },
    );
    return result;
  }

  /**
   * パーソナルフィードの件数を取得する
   * @returns パーソナルフィードの件数
   */
  async count(): Promise<number> {
    this.logger.debug(`PersonalizedFeedsRepository.count called`);
    const result = await this.prisma.personalizedFeed.count();
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

    const result = await this.prisma.personalizedFeed.findMany({
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
}
