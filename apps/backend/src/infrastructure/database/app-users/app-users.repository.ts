import { AppUserFindError } from '@/types/errors';
import { IAppUsersRepository } from '@domains/app-user/app-users.repository.interface';
import { Injectable, Logger } from '@nestjs/common';
import { AppUser } from '@prisma/client';
import {
  PrismaClientManager,
  UserWithSubscription,
} from '@tech-post-cast/database';

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
      this.logger.error(error.message, error.stack);
      throw new AppUserFindError(errorMessage, {
        cause: error,
      });
    }
  }

  /**
   * 指定されたユーザーIDに対応するユーザーとサブスクリプション情報を取得する
   * @param userId - ユーザーID
   * @returns ユーザー情報とサブスクリプション情報
   * @throws AppUserFindError - ユーザーが見つからない場合
   */
  async findOneWithSubscription(userId: string): Promise<UserWithSubscription> {
    this.logger.debug('AppUserRepository.findOneWithSubscription called', {
      userId,
    });

    try {
      const client = this.prisma.getClient();
      const user = await client.appUser.findUnique({
        where: { id: userId },
        include: {
          subscriptions: {
            where: {
              isActive: true,
              endDate: {
                gt: new Date(),
              },
            },
            include: {
              plan: true,
            },
            orderBy: {
              startDate: 'desc',
            },
            take: 1,
          },
        },
      });

      if (!user) {
        const errorMessage = `ユーザー [${userId}] は登録されていません`;
        throw new AppUserFindError(errorMessage);
      }
      if (user.subscriptions.length === 0) {
        throw new AppUserFindError(
          `ユーザー [${userId}] はサブスクリプションがありません`,
        );
      }
      return user;
    } catch (error) {
      const errorMessage = `ユーザー [${userId}] のサブスクリプション情報の取得に失敗しました`;
      this.logger.error(errorMessage, {
        error,
        userId,
      });
      this.logger.error(error.message, error.stack);
      throw new AppUserFindError(errorMessage, {
        cause: error,
      });
    }
  }
}
