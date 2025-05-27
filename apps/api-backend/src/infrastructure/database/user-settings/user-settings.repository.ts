import {
  UserSettingsNotFoundError,
  UserSettingsRetrievalError,
  UserSettingsUpdateError,
} from '@/types/errors';
import {
  UpdateUserSettingsParams,
  UserSettings,
} from '@domains/user-settings/user-settings.entity';
import { IUserSettingsRepository } from '@domains/user-settings/user-settings.repository.interface';
import { Injectable, Logger } from '@nestjs/common';
import { AppUser } from '@prisma/client';
import { PrismaClientManager } from '@tech-post-cast/database';

/**
 * IUserSettingsRepository の実装
 * Prisma を利用してデータベースにアクセスする
 */
@Injectable()
export class UserSettingsRepository implements IUserSettingsRepository {
  private readonly logger = new Logger(UserSettingsRepository.name);

  constructor(private readonly prisma: PrismaClientManager) {}

  /**
   * 指定ユーザーのユーザー設定を取得する
   * @param appUser 取得するユーザー
   * @returns ユーザー設定情報
   * @throws UserSettingsNotFoundError ユーザーが存在しない場合
   * @throws UserSettingsRetrievalError 取得処理でエラーが発生した場合
   */
  async findByAppUser(appUser: AppUser): Promise<UserSettings> {
    this.logger.debug('UserSettingsRepository.findByAppUser called', {
      userId: appUser.id,
      displayName: appUser.displayName,
    });

    try {
      // AppUserテーブルから直接ユーザー設定情報を取得
      const client = this.prisma.getClient();
      const user = await client.appUser.findUnique({
        where: { id: appUser.id },
        select: {
          id: true,
          displayName: true,
          slackWebhookUrl: true,
          notificationEnabled: true,
          updatedAt: true,
        },
      });

      if (!user) {
        const errorMessage = `ユーザー [${appUser.id}] が見つかりません`;
        this.logger.warn(errorMessage, { userId: appUser.id });
        throw new UserSettingsNotFoundError(errorMessage);
      }

      const userSettings: UserSettings = {
        userId: user.id,
        displayName: user.displayName,
        slackWebhookUrl: user.slackWebhookUrl || undefined,
        notificationEnabled: user.notificationEnabled,
        updatedAt: user.updatedAt,
      };

      this.logger.debug('ユーザー設定を取得しました', {
        userId: user.id,
        notificationEnabled: user.notificationEnabled,
        hasSlackWebhook: !!user.slackWebhookUrl,
      });

      return userSettings;
    } catch (error) {
      if (error instanceof UserSettingsNotFoundError) {
        throw error;
      }

      const errorMessage = `ユーザー設定の取得に失敗しました`;
      this.logger.error(errorMessage, {
        userId: appUser.id,
        error: error.message,
        stack: error.stack,
      });
      throw new UserSettingsRetrievalError(errorMessage, { cause: error });
    }
  }

  /**
   * 指定ユーザーのユーザー設定を更新する
   * @param appUser 更新するユーザー
   * @param params 更新パラメータ
   * @returns 更新されたユーザー設定情報
   * @throws UserSettingsNotFoundError ユーザーが存在しない場合
   * @throws UserSettingsUpdateError 更新処理でエラーが発生した場合
   */
  async updateByAppUser(
    appUser: AppUser,
    params: UpdateUserSettingsParams,
  ): Promise<UserSettings> {
    this.logger.debug('UserSettingsRepository.updateByAppUser called', {
      userId: appUser.id,
      displayName: appUser.displayName,
      params: {
        displayName: params.displayName,
        notificationEnabled: params.notificationEnabled,
        hasSlackWebhook: !!params.slackWebhookUrl,
      },
    });

    try {
      // 更新データを準備
      const updateData: any = {};

      if (params.displayName !== undefined) {
        updateData.displayName = params.displayName;
      }

      if (params.slackWebhookUrl !== undefined) {
        updateData.slackWebhookUrl = params.slackWebhookUrl;
      }

      if (params.notificationEnabled !== undefined) {
        updateData.notificationEnabled = params.notificationEnabled;
      }

      // AppUserテーブルを更新
      const client = this.prisma.getClient();
      const updatedUser = await client.appUser.update({
        where: { id: appUser.id },
        data: updateData,
        select: {
          id: true,
          displayName: true,
          slackWebhookUrl: true,
          notificationEnabled: true,
          updatedAt: true,
        },
      });

      const userSettings: UserSettings = {
        userId: updatedUser.id,
        displayName: updatedUser.displayName,
        slackWebhookUrl: updatedUser.slackWebhookUrl || undefined,
        notificationEnabled: updatedUser.notificationEnabled,
        updatedAt: updatedUser.updatedAt,
      };

      this.logger.log('ユーザー設定を更新しました', {
        userId: updatedUser.id,
        notificationEnabled: updatedUser.notificationEnabled,
        hasSlackWebhook: !!updatedUser.slackWebhookUrl,
      });

      return userSettings;
    } catch (error) {
      // Prismaの P2025 エラー（レコードが見つからない）をチェック
      if (error.code === 'P2025') {
        const errorMessage = `更新対象のユーザー [${appUser.id}] が見つかりません`;
        this.logger.warn(errorMessage, { userId: appUser.id });
        throw new UserSettingsNotFoundError(errorMessage);
      }

      const errorMessage = `ユーザー設定の更新に失敗しました`;
      this.logger.error(errorMessage, {
        userId: appUser.id,
        error: error.message,
        stack: error.stack,
        params,
      });
      throw new UserSettingsUpdateError(errorMessage, { cause: error });
    }
  }
}
