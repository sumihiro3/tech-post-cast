import { PrismaService } from '@tech-post-cast/database';
import { IQiitaPostsRepository } from '@domains/qiita-posts/qiita-posts.repository.interface';
import { Injectable, Logger } from '@nestjs/common';
import { QiitaPost } from '@prisma/client';

/**
 * IQiitaItemsRepository の実装
 * Prisma を利用してデータベースにアクセスする
 */
@Injectable()
export class QiitaPostsRepository implements IQiitaPostsRepository {
  private readonly logger = new Logger(QiitaPostsRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 指定 ID の Qiita 記事を取得する
   * @param id Qiita 記事 ID
   * @returns Qiita 記事
   */
  async findOne(id: string): Promise<QiitaPost> {
    this.logger.verbose({ id }, `QiitaItemsRepository.findOne called`);
    const result = await this.prisma.qiitaPost.findUnique({
      where: { id },
    });
    this.logger.debug(`指定の記事 [${id}] を取得しました`, { result });
    return result;
  }
}
