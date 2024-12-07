import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { isFullWidthCharacter } from '@tech-post-cast/commons';
import { QiitaPost } from '@prisma/client';
import { QiitaPostsRepository } from '@infrastructure/database/qiita-posts/qiita-posts.repository';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  constructor(private readonly QiitaPostsRepository: QiitaPostsRepository) {}

  getHello(): string {
    this.logger.debug(`isFullWidthCharacter: ${isFullWidthCharacter(0x0)}`);
    return 'Hello World!';
  }

  async getQiitaPost(id: string): Promise<QiitaPost> {
    const result = await this.QiitaPostsRepository.findOne(id);
    if (!result) {
      throw new NotFoundException(`指定の記事 [${id}] は存在しません`);
    }
    return result;
  }
}
