import { IAppUsersRepository } from '@/domains/app-users/app-users.repository.interface';
import {
  AppUserCreateError,
  AppUserDeleteError,
  AppUserFindError,
  AppUserUpdateError,
} from '@/types/errors/app-user.error';
import { Injectable, Logger } from '@nestjs/common';
import { AppUser } from '@prisma/client';
import {
  PrismaClientManager,
  SubscriptionStatus,
  UserWithSubscriptionResult,
} from '@tech-post-cast/database';

/**
 * IAppUsersRepository の実装
 */
@Injectable()
export class AppUsersRepository implements IAppUsersRepository {
  private readonly logger = new Logger(AppUsersRepository.name);

  constructor(private readonly prisma: PrismaClientManager) {}

  /**
   * 指定されたユーザーIDに対応するユーザーを取得する
   * @param userId - ユーザーID
   * @returns ユーザー情報
   * @throws AppUserFindError - ユーザーが見つからない場合
   */
  async findOne(userId: string): Promise<AppUser> {
    this.logger.debug('AppUserRepository.findOne called', { userId });

    try {
      const client = this.prisma.getClient();
      const result = await client.appUser.findUnique({
        where: { id: userId },
      });

      if (!result) {
        const errorMessage = `ユーザー [${userId}] は登録されていません`;
        throw new AppUserFindError(errorMessage);
      }

      return result;
    } catch (error) {
      const errorMessage = `ユーザー [${userId}] の取得に失敗しました`;
      throw new AppUserFindError(errorMessage, {
        cause: error,
      });
    }
  }

  /**
   * 新規ユーザーを作成する
   * @param appUser - 新規ユーザー情報
   * @returns 作成されたユーザー情報
   * @throws AppUserCreateError - ユーザーの作成に失敗した場合
   */
  async create(appUser: AppUser): Promise<AppUser> {
    this.logger.debug('AppUserRepository.create called', { appUser });

    try {
      const client = this.prisma.getClient();
      const result = await client.appUser.upsert({
        where: { id: appUser.id },
        update: appUser,
        create: appUser,
      });
      this.logger.debug(`ユーザー [${appUser.id}] を作成しました`, {
        appUser: result,
      });
      return result;
    } catch (error) {
      const errorMessage = `ユーザー [${appUser.id}] の作成に失敗しました`;
      throw new AppUserCreateError(errorMessage, {
        cause: error,
      });
    }
  }

  /**
   * ユーザー情報を更新する
   * @param appUser - 更新するユーザー情報
   * @returns 更新されたユーザー情報
   * @throws AppUserUpdateError - ユーザーの更新に失敗した場合
   */
  async update(appUser: AppUser): Promise<AppUser> {
    this.logger.debug('AppUserRepository.update called', { appUser });

    try {
      const client = this.prisma.getClient();
      const user = await this.findOne(appUser.id);
      if (!user) {
        const errorMessage = `更新対象ユーザー [${appUser.id}] は登録されていません`;
        throw new AppUserUpdateError(errorMessage);
      }
      // ユーザー情報を更新
      const result = await client.appUser.update({
        where: { id: appUser.id },
        data: appUser,
      });
      this.logger.debug(`ユーザー [${appUser.id}] を更新しました`, {
        appUser: result,
      });
      return result;
    } catch (error) {
      const errorMessage = `ユーザー [${appUser.id}] の更新に失敗しました`;
      throw new AppUserUpdateError(errorMessage, {
        cause: error,
      });
    }
  }

  /**
   * 指定されたユーザーIDに対応するユーザーを削除する
   * @param userId - ユーザーID
   * @throws AppUserDeleteError - ユーザーの削除に失敗した場合
   */
  async delete(userId: string): Promise<void> {
    this.logger.debug('AppUserRepository.delete called', { userId });

    try {
      const client = this.prisma.getClient();
      const user = await this.findOne(userId);
      if (!user) {
        const errorMessage = `削除対象ユーザー [${userId}] は登録されていません`;
        throw new AppUserDeleteError(errorMessage);
      }

      await client.appUser.update({
        where: { id: userId },
        data: { isActive: false },
      });

      this.logger.debug('AppUserRepository.delete succeeded', { userId });
    } catch (error) {
      const errorMessage = `ユーザー [${userId}] の削除に失敗しました`;
      throw new AppUserDeleteError(errorMessage, {
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
  async findOneWithSubscription(
    userId: string,
  ): Promise<UserWithSubscriptionResult> {
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

      const subscription = user.subscriptions[0];
      if (!subscription) {
        return {
          user,
          subscription: null,
        };
      }

      return {
        user,
        subscription: {
          status: subscription.status as SubscriptionStatus,
          plan: subscription.plan,
          limits: {
            maxFeeds: subscription.plan.maxFeeds,
            maxAuthors: subscription.plan.maxAuthors,
            maxTags: subscription.plan.maxTags,
          },
        },
      };
    } catch (error) {
      const errorMessage = `ユーザー [${userId}] のサブスクリプション情報の取得に失敗しました`;
      throw new AppUserFindError(errorMessage, {
        cause: error,
      });
    }
  }
}
