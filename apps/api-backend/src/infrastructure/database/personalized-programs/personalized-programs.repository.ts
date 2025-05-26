import {
  IPersonalizedProgramsRepository,
  PaginationOptions,
  PersonalizedProgramsResult,
} from '@/domains/personalized-programs/personalized-programs.repository.interface';
import {
  PersonalizedProgramDatabaseError,
  PersonalizedProgramRetrievalError,
} from '@/types/errors';
import { Injectable, Logger } from '@nestjs/common';
import {
  PersonalizedFeedProgramWithDetails,
  PrismaClientManager,
} from '@tech-post-cast/database';

@Injectable()
export class PersonalizedProgramsRepository
  implements IPersonalizedProgramsRepository
{
  private readonly logger = new Logger(PersonalizedProgramsRepository.name);

  constructor(private readonly prisma: PrismaClientManager) {}

  /**
   * 指定ユーザーのパーソナルプログラム一覧をページネーション付きで取得する
   */
  async findByUserIdWithPagination(
    userId: string,
    options: PaginationOptions,
  ): Promise<PersonalizedProgramsResult> {
    this.logger.debug(
      'PersonalizedProgramsRepository.findByUserIdWithPagination called',
      { userId, options },
    );

    try {
      const client = this.prisma.getClient();

      // 総件数を取得
      const totalCount = await client.personalizedFeedProgram.count({
        where: { userId },
      });

      // プログラム一覧を取得
      const programs = await client.personalizedFeedProgram.findMany({
        where: { userId },
        include: {
          feed: {
            select: {
              id: true,
              name: true,
              dataSource: true,
            },
          },
          posts: {
            select: {
              id: true,
              title: true,
              url: true,
              likesCount: true,
              stocksCount: true,
              createdAt: true,
              updatedAt: true,
              authorId: true,
              authorName: true,
              private: true,
              refreshedAt: true,
              summary: true,
            },
          },
        },
        orderBy: options.orderBy || { createdAt: 'desc' },
        take: options.limit,
        skip: options.offset,
      });

      // Prismaの結果をPersonalizedFeedProgramWithDetailsとして型アサーション
      const programsWithDetails =
        programs as PersonalizedFeedProgramWithDetails[];

      this.logger.log('パーソナルプログラム一覧を取得しました', {
        userId,
        totalCount,
        retrievedCount: programsWithDetails.length,
      });

      return {
        programs: programsWithDetails,
        totalCount,
      };
    } catch (error) {
      const errorMessage = `ユーザー [${userId}] のパーソナルプログラム一覧の取得に失敗しました`;
      this.logger.error(errorMessage, {
        error,
        userId,
        options,
      });
      this.logger.error(error.message, error.stack);
      throw new PersonalizedProgramRetrievalError(errorMessage, {
        cause: error,
      });
    }
  }

  /**
   * 指定IDのパーソナルプログラムを取得する
   */
  async findById(
    id: string,
  ): Promise<PersonalizedFeedProgramWithDetails | null> {
    this.logger.debug('PersonalizedProgramsRepository.findById called', {
      id,
    });

    try {
      const client = this.prisma.getClient();

      const program = await client.personalizedFeedProgram.findUnique({
        where: { id },
        include: {
          feed: {
            select: {
              id: true,
              name: true,
              dataSource: true,
            },
          },
          posts: {
            select: {
              id: true,
              title: true,
              url: true,
              likesCount: true,
              stocksCount: true,
              createdAt: true,
              updatedAt: true,
              authorId: true,
              authorName: true,
              private: true,
              refreshedAt: true,
              summary: true,
            },
          },
        },
      });

      if (!program) {
        this.logger.warn(`パーソナルプログラム [${id}] が見つかりませんでした`);
        return null;
      }

      this.logger.log(`パーソナルプログラム [${id}] を取得しました`);

      // Prismaの結果をPersonalizedFeedProgramWithDetailsとして型アサーション
      return program as PersonalizedFeedProgramWithDetails;
    } catch (error) {
      const errorMessage = `パーソナルプログラム [${id}] の取得に失敗しました`;
      this.logger.error(errorMessage, {
        error,
        id,
      });
      this.logger.error(error.message, error.stack);
      throw new PersonalizedProgramDatabaseError(errorMessage, {
        cause: error,
      });
    }
  }
}
