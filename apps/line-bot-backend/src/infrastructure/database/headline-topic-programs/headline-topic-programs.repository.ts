import { IHeadlineTopicProgramsRepository } from '@domains/headline-topic-programs/headline-topic-programs.repository.interface';
import { Injectable, Logger } from '@nestjs/common';
import {
  HeadlineTopicProgramWithQiitaPosts,
  PrismaService,
} from '@tech-post-cast/database';

/**
 * IHeadlineTopicProgramsRepository の実装
 * Prisma を利用してデータベースにアクセスする
 */
@Injectable()
export class HeadlineTopicProgramsRepository
  implements IHeadlineTopicProgramsRepository
{
  private readonly logger = new Logger(HeadlineTopicProgramsRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 指定IDのヘッドライントピック番組を取得する
   * @param id ヘッドライントピック番組ID
   * @returns ヘッドライントピック番組
   */
  async findById(
    id: string,
  ): Promise<HeadlineTopicProgramWithQiitaPosts | null> {
    this.logger.debug(`HeadlineTopicProgramsRepository.findById called`, {
      id,
    });
    const result = await this.prisma.headlineTopicProgram.findUnique({
      where: {
        id,
      },
      include: {
        posts: true,
      },
    });
    this.logger.debug(`ヘッドライントピック番組を取得しました`, {
      result,
    });
    return result;
  }

  /**
   * 最新のヘッドライントピック番組を取得する
   * @returns ヘッドライントピック番組
   */
  async findLatest(): Promise<HeadlineTopicProgramWithQiitaPosts | null> {
    this.logger.debug(`HeadlineTopicProgramsRepository.findLatest called`);
    const result = await this.prisma.headlineTopicProgram.findFirst({
      where: {
        AND: {
          videoUrl: {
            not: undefined,
          },
          audioUrl: {
            not: undefined,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        posts: true,
      },
    });
    this.logger.debug(`最新のヘッドライントピック番組を取得しました`, {
      result,
    });
    return result;
  }
}
