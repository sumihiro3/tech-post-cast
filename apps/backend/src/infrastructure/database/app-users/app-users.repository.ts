import { AppUserFindError } from '@/types/errors';
import { IAppUsersRepository } from '@domains/app-user/app-users.repository.interface';
import { Injectable, Logger } from '@nestjs/common';
import { AppUser } from '@prisma/client';
import { PrismaClientManager } from '@tech-post-cast/database';

/**
 * IAppUsersRepository の実装
 * Prisma を利用してデータベースにアクセスする
 */
@Injectable()
export class AppUsersRepository implements IAppUsersRepository {
  private readonly logger = new Logger(AppUsersRepository.name);

  constructor(private readonly prisma: PrismaClientManager) {}

  /**
   * 指定IDのユーザーを取得する
   * @param userId 取得するユーザーID
   * @returns 取得されたユーザー
   */
  async findOne(userId: string): Promise<AppUser> {
    this.logger.debug('AppUserRepository.findOne called', { userId });
    try {
      const client = this.prisma.getClient();
      const result = await client.appUser.findUnique({
        where: { id: userId },
      });
      return result;
    } catch (error) {
      const errorMessage = `ユーザーの取得に失敗しました`;
      this.logger.error(errorMessage, {
        error,
        userId,
      });
      throw new AppUserFindError(errorMessage, {
        cause: error,
      });
    }
  }
}
