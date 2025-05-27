import {
  SlackWebhookTestError,
  UserSettingsNotFoundError,
  UserSettingsRetrievalError,
  UserSettingsUpdateError,
} from '@/types/errors';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { AppUser } from '@prisma/client';
import {
  SlackWebhookTestResult,
  UpdateUserSettingsParams,
  UserSettings,
} from './user-settings.entity';
import { IUserSettingsRepository } from './user-settings.repository.interface';

/**
 * ユーザー設定サービス
 * ユーザー設定の取得・更新・Slack通知テストなどのビジネスロジックを管理
 */
@Injectable()
export class UserSettingsService {
  private readonly logger = new Logger(UserSettingsService.name);

  constructor(
    @Inject('UserSettingsRepository')
    private readonly userSettingsRepository: IUserSettingsRepository,
  ) {}

  /**
   * 指定ユーザーのユーザー設定を取得する
   * @param appUser 取得するユーザー
   * @returns ユーザー設定情報
   * @throws UserSettingsNotFoundError ユーザーが存在しない場合
   * @throws UserSettingsRetrievalError 取得処理でエラーが発生した場合
   */
  async getUserSettings(appUser: AppUser): Promise<UserSettings> {
    this.logger.debug('UserSettingsService.getUserSettings called', {
      userId: appUser.id,
      displayName: appUser.displayName,
    });

    try {
      const userSettings =
        await this.userSettingsRepository.findByAppUser(appUser);
      this.logger.debug('ユーザー設定を取得しました', {
        userId: appUser.id,
        notificationEnabled: userSettings.notificationEnabled,
        hasSlackWebhook: !!userSettings.slackWebhookUrl,
      });
      return userSettings;
    } catch (error) {
      if (error instanceof UserSettingsNotFoundError) {
        this.logger.warn('ユーザー設定が見つかりません', {
          userId: appUser.id,
        });
        throw error;
      }
      this.logger.error('ユーザー設定の取得に失敗しました', {
        userId: appUser.id,
        error: error.message,
      });
      throw new UserSettingsRetrievalError('ユーザー設定の取得に失敗しました', {
        cause: error,
      });
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
  async updateUserSettings(
    appUser: AppUser,
    params: UpdateUserSettingsParams,
  ): Promise<UserSettings> {
    this.logger.debug('UserSettingsService.updateUserSettings called', {
      userId: appUser.id,
      displayName: appUser.displayName,
      params: {
        displayName: params.displayName,
        notificationEnabled: params.notificationEnabled,
        hasSlackWebhook: !!params.slackWebhookUrl,
      },
    });

    try {
      // Slack Webhook URLが設定されている場合は、URLの形式をバリデーション
      if (params.slackWebhookUrl) {
        this.validateSlackWebhookUrl(params.slackWebhookUrl);
      }

      const updatedSettings = await this.userSettingsRepository.updateByAppUser(
        appUser,
        params,
      );

      this.logger.log('ユーザー設定を更新しました', {
        userId: appUser.id,
        notificationEnabled: updatedSettings.notificationEnabled,
        hasSlackWebhook: !!updatedSettings.slackWebhookUrl,
      });

      return updatedSettings;
    } catch (error) {
      if (error instanceof UserSettingsNotFoundError) {
        this.logger.warn('更新対象のユーザーが見つかりません', {
          userId: appUser.id,
        });
        throw error;
      }
      this.logger.error('ユーザー設定の更新に失敗しました', {
        userId: appUser.id,
        error: error.message,
      });
      throw new UserSettingsUpdateError('ユーザー設定の更新に失敗しました', {
        cause: error,
      });
    }
  }

  /**
   * Slack Webhook URLの接続テストを実行する
   * @param webhookUrl テストするWebhook URL
   * @returns テスト結果
   * @throws SlackWebhookTestError テスト実行でエラーが発生した場合
   */
  async testSlackWebhook(webhookUrl: string): Promise<SlackWebhookTestResult> {
    this.logger.debug('UserSettingsService.testSlackWebhook called', {
      webhookUrl: this.maskWebhookUrl(webhookUrl),
    });

    const startTime = Date.now();

    try {
      // Webhook URLの形式をバリデーション
      this.validateSlackWebhookUrl(webhookUrl);

      // テスト通知を送信
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'TechPostCast テスト通知',
          icon_emoji: ':test_tube:',
          text: 'Slack Webhook URLの接続テストです。この通知が表示されれば設定は正常です。',
        }),
      });

      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        const errorMessage = `Slack API エラー: ${response.status} ${response.statusText}`;
        this.logger.warn('Slack Webhook テストが失敗しました', {
          webhookUrl: this.maskWebhookUrl(webhookUrl),
          status: response.status,
          statusText: response.statusText,
          responseTime,
        });
        return {
          success: false,
          errorMessage,
          responseTime,
        };
      }

      this.logger.log('Slack Webhook テストが成功しました', {
        webhookUrl: this.maskWebhookUrl(webhookUrl),
        responseTime,
      });

      return {
        success: true,
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage =
        error.message || 'Slack Webhook テストでエラーが発生しました';

      this.logger.error('Slack Webhook テストでエラーが発生しました', {
        webhookUrl: this.maskWebhookUrl(webhookUrl),
        error: errorMessage,
        responseTime,
      });

      throw new SlackWebhookTestError(errorMessage, { cause: error });
    }
  }

  /**
   * Slack Webhook URLの形式をバリデーションする
   * @param webhookUrl バリデーションするWebhook URL
   * @throws Error 無効な形式の場合
   */
  private validateSlackWebhookUrl(webhookUrl: string): void {
    if (!webhookUrl) {
      throw new Error('Slack Webhook URLが指定されていません');
    }

    // Slack Webhook URLの基本的な形式チェック
    const slackWebhookPattern =
      /^https:\/\/hooks\.slack\.com\/services\/[A-Z0-9]+\/[A-Z0-9]+\/[a-zA-Z0-9]+$/;
    if (!slackWebhookPattern.test(webhookUrl)) {
      throw new Error('無効なSlack Webhook URL形式です');
    }
  }

  /**
   * ログ出力用にWebhook URLをマスクする
   * @param webhookUrl マスクするWebhook URL
   * @returns マスクされたWebhook URL
   */
  private maskWebhookUrl(webhookUrl: string): string {
    if (!webhookUrl) return '';

    // URLの最後の部分（トークン）をマスク
    const parts = webhookUrl.split('/');
    if (parts.length >= 3) {
      parts[parts.length - 1] = '***';
    }
    return parts.join('/');
  }
}
