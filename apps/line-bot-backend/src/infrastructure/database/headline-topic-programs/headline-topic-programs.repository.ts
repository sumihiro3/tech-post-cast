import { HeadlineTopicProgram } from '.prisma/client';
import { IHeadlineTopicProgramsRepository } from '@domains/headline-topic-programs/headline-topic-programs.repository.interface';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@tech-post-cast/database';

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
   * 最新のヘッドライントピック番組を取得する
   * @returns ヘッドライントピック番組
   */
  async findLatest(): Promise<HeadlineTopicProgram | null> {
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
    });
    this.logger.debug(`最新のヘッドライントピック番組を取得しました`, {
      result,
    });
    return result;
  }
}
