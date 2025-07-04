import { AppConfigService } from '@/app-config/app-config.service';
import { IAppUsersRepository } from '@/domains/app-users/app-users.repository.interface';
import {
  AppUserCreateError,
  AppUserDeleteError,
  AppUserFindError,
  AppUserUpdateError,
} from '@/types/errors/app-user.error';
import { Injectable, Logger } from '@nestjs/common';
import { AppUser } from '@prisma/client';
import { addDays } from '@tech-post-cast/commons';
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

  constructor(
    private readonly appConfigService: AppConfigService,
    private readonly prisma: PrismaClientManager,
  ) {}

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
      this.logger.error(errorMessage, error.message, error.stack);
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
      // ユーザーの新規作成時にユーザーサブスクリプション（フリープラン）も併せて作成する
      const result = await this.prisma.transaction(async () => {
        const client = this.prisma.getClient();
        const now = new Date();
        const subscriptionEndDate = addDays(now, 365);

        const createdUser = await client.appUser.create({
          data: {
            ...appUser,
            // TODO ハッカソンの審査中のみデフォルトで複数話者モードを有効にする
            personalizedProgramDialogueEnabled: true,
            createdAt: now,
            updatedAt: now,
          },
        });
        // ユーザーサブスクリプション
        const createdSubscription = await client.subscription.create({
          data: {
            userId: createdUser.id,
            planId: this.appConfigService.FreePlanId,
            isActive: true,
            status: SubscriptionStatus.ACTIVE,
            startDate: now,
            endDate: subscriptionEndDate,
            createdAt: now,
            updatedAt: now,
          },
        });
        this.logger.debug(`ユーザー [${appUser.id}] を作成しました`, {
          appUser: createdUser,
          subscription: createdSubscription,
        });
        return createdUser;
      });
      return result;
    } catch (error) {
      const errorMessage = `ユーザー [${appUser.id}] の作成に失敗しました`;
      this.logger.error(errorMessage, error.message, error.stack);
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
      this.logger.error(errorMessage, error.message, error.stack);
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
      // ユーザーの削除時にユーザーのパーソナルフィードをすべて無効にする
      // ユーザーのサブスクリプションをすべて無効にする
      // TODO Stripeのサブスクリプションをキャンセルする
      await this.prisma.transaction(async () => {
        const client = this.prisma.getClient();
        const user = await this.findOne(userId);
        if (!user) {
          const errorMessage = `削除対象ユーザー [${userId}] は登録されていません`;
          throw new AppUserDeleteError(errorMessage);
        }
        // ユーザーを論理削除
        await client.appUser.update({
          where: { id: userId },
          data: { isActive: false },
        });
        // ユーザーのパーソナルフィードをすべて無効にする
        await client.personalizedFeed.updateMany({
          where: { userId: userId, isActive: true },
          data: { isActive: false },
        });
        // ユーザーのサブスクリプションをすべて無効にする
        await client.subscription.updateMany({
          where: { userId: userId, isActive: true },
          data: { isActive: false },
        });
        // TODO Stripeのサブスクリプションをキャンセルする
      });

      this.logger.debug('AppUserRepository.delete succeeded', { userId });
    } catch (error) {
      const errorMessage = `ユーザー [${userId}] の削除に失敗しました`;
      this.logger.error(errorMessage, error.message, error.stack);
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
          id: subscription.id,
          userId: subscription.userId,
          planId: subscription.planId,
          status: subscription.status as SubscriptionStatus,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          isActive: subscription.isActive,
          plan: subscription.plan,
        },
      };
    } catch (error) {
      const errorMessage = `ユーザー [${userId}] のサブスクリプション情報の取得に失敗しました`;
      this.logger.error(errorMessage, error.message, error.stack);
      throw new AppUserFindError(errorMessage, {
        cause: error,
      });
    }
  }

  /**
   * RSSトークンでユーザーを検索する
   * @param rssToken - RSSトークン
   * @returns 該当するユーザー（見つからない場合はnull）
   * @throws AppUserFindError - 検索に失敗した場合
   */
  async findByRssToken(rssToken: string): Promise<AppUser | null> {
    this.logger.debug('AppUserRepository.findByRssToken called', { rssToken });

    try {
      const client = this.prisma.getClient();
      const result = await client.appUser.findUnique({
        where: {
          rssToken: rssToken,
          rssEnabled: true, // RSS機能が有効なユーザーのみ
        },
      });

      return result;
    } catch (error) {
      const errorMessage = `RSSトークン [${rssToken}] でのユーザー検索に失敗しました`;
      this.logger.error(errorMessage, error.message, error.stack);
      throw new AppUserFindError(errorMessage, {
        cause: error,
      });
    }
  }

  /**
   * ユーザーのRSS設定を更新する
   * @param userId - ユーザーID
   * @param rssEnabled - RSS機能の有効/無効
   * @param rssToken - RSSトークン（新規生成時のみ）
   * @returns 更新されたユーザー
   * @throws AppUserUpdateError - 更新に失敗した場合
   */
  async updateRssSettings(
    userId: string,
    rssEnabled: boolean,
    rssToken?: string,
  ): Promise<AppUser> {
    this.logger.debug('AppUserRepository.updateRssSettings called', {
      userId,
      rssEnabled,
      hasRssToken: !!rssToken,
    });

    try {
      const client = this.prisma.getClient();
      const user = await this.findOne(userId);
      if (!user) {
        const errorMessage = `更新対象ユーザー [${userId}] は登録されていません`;
        throw new AppUserUpdateError(errorMessage);
      }

      const now = new Date();
      const updateData: any = {
        rssEnabled,
        rssUpdatedAt: now,
        updatedAt: now,
      };

      // RSS機能を有効にする場合
      if (rssEnabled) {
        if (rssToken) {
          // 新しいトークンが提供された場合
          updateData.rssToken = rssToken;
          updateData.rssCreatedAt = now;
        } else if (!user.rssToken) {
          // トークンが未設定の場合はエラー
          const errorMessage = `RSS機能を有効にするにはRSSトークンが必要です`;
          throw new AppUserUpdateError(errorMessage);
        }
      } else {
        // RSS機能を無効にする場合はトークンをクリア
        updateData.rssToken = null;
        updateData.rssCreatedAt = null;
      }

      const result = await client.appUser.update({
        where: { id: userId },
        data: updateData,
      });

      this.logger.debug(`ユーザー [${userId}] のRSS設定を更新しました`, {
        rssEnabled,
        hasRssToken: !!result.rssToken,
      });

      return result;
    } catch (error) {
      const errorMessage = `ユーザー [${userId}] のRSS設定更新に失敗しました`;
      this.logger.error(errorMessage, error.message, error.stack);
      throw new AppUserUpdateError(errorMessage, {
        cause: error,
      });
    }
  }

  /**
   * ユーザーのRSSトークンを再生成する
   * @param userId - ユーザーID
   * @param newRssToken - 新しいRSSトークン
   * @returns 更新されたユーザー
   * @throws AppUserUpdateError - 更新に失敗した場合
   */
  async regenerateRssToken(
    userId: string,
    newRssToken: string,
  ): Promise<AppUser> {
    this.logger.debug('AppUserRepository.regenerateRssToken called', {
      userId,
    });

    try {
      const client = this.prisma.getClient();
      const user = await this.findOne(userId);
      if (!user) {
        const errorMessage = `更新対象ユーザー [${userId}] は登録されていません`;
        throw new AppUserUpdateError(errorMessage);
      }

      if (!user.rssEnabled) {
        const errorMessage = `ユーザー [${userId}] のRSS機能が無効です`;
        throw new AppUserUpdateError(errorMessage);
      }

      const now = new Date();
      const result = await client.appUser.update({
        where: { id: userId },
        data: {
          rssToken: newRssToken,
          rssCreatedAt: now,
          rssUpdatedAt: now,
          updatedAt: now,
        },
      });

      this.logger.debug(`ユーザー [${userId}] のRSSトークンを再生成しました`);

      return result;
    } catch (error) {
      const errorMessage = `ユーザー [${userId}] のRSSトークン再生成に失敗しました`;
      this.logger.error(errorMessage, error.message, error.stack);
      throw new AppUserUpdateError(errorMessage, {
        cause: error,
      });
    }
  }
}
