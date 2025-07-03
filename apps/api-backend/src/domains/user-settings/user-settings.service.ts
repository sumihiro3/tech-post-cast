import { AppConfigService } from '@/app-config/app-config.service';
import { IAppUsersRepository } from '@/domains/app-users/app-users.repository.interface';
import {
  SlackWebhookTestError,
  UserSettingsNotFoundError,
  UserSettingsRetrievalError,
  UserSettingsUpdateError,
} from '@/types/errors';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { AppUser } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { RssFileService } from './rss-file.service';
import {
  RssTokenRegenerationResult,
  SlackWebhookTestResult,
  UpdateRssSettingsParams,
  UpdateUserSettingsParams,
  UserSettings,
} from './user-settings.entity';
import { IUserSettingsRepository } from './user-settings.repository.interface';

/**
 * ユーザー設定サービス
 * ユーザー設定の取得・更新・Slack通知テスト・RSS設定管理などのビジネスロジックを管理
 */
@Injectable()
export class UserSettingsService {
  private readonly logger = new Logger(UserSettingsService.name);

  constructor(
    @Inject('UserSettingsRepository')
    private readonly userSettingsRepository: IUserSettingsRepository,
    @Inject('AppUserRepository')
    private readonly appUserRepository: IAppUsersRepository,
    private readonly appConfigService: AppConfigService,
    private readonly rssFileService: RssFileService,
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

  /**
   * RSS設定を更新する
   * @param appUser 対象ユーザー
   * @param params RSS設定更新パラメータ
   * @returns 更新後のユーザー設定
   * @throws UserSettingsUpdateError 更新に失敗した場合
   */
  async updateRssSettings(
    appUser: AppUser,
    params: UpdateRssSettingsParams,
  ): Promise<UserSettings> {
    try {
      this.logger.log(
        `RSS設定を更新します: ${appUser.id}, enabled: ${params.rssEnabled}`,
      );

      let rssToken: string | undefined;
      const wasRssEnabled = appUser.rssEnabled;
      const oldRssToken = appUser.rssToken;

      if (params.rssEnabled) {
        // RSS有効化の場合
        if (!appUser.rssToken) {
          // 新規トークン生成
          rssToken = uuidv4();
          this.logger.log(`新しいRSSトークンを生成しました: ${appUser.id}`);
        }
        // 既存トークンがある場合はundefinedのまま（更新しない）
      } else {
        // RSS無効化の場合はundefinedを渡してクリア
        rssToken = undefined;
      }

      await this.appUserRepository.updateRssSettings(
        appUser.id,
        params.rssEnabled,
        rssToken,
      );

      // 更新後のユーザー情報を取得
      const updatedAppUser = await this.appUserRepository.findOne(appUser.id);
      if (!updatedAppUser) {
        throw new UserSettingsUpdateError(
          `ユーザーが見つかりません: ${appUser.id}`,
        );
      }

      // RSS無効化時に古いRSSファイルを削除
      if (!params.rssEnabled && wasRssEnabled && oldRssToken) {
        try {
          this.logger.log(
            `RSS無効化により古いRSSファイルを削除します: ${updatedAppUser.id}`,
          );
          await this.rssFileService.deleteUserRssFile(
            oldRssToken,
            updatedAppUser.id,
          );
          this.logger.log(
            `古いRSSファイルの削除が完了しました: ${updatedAppUser.id}`,
          );
        } catch (deleteError) {
          // RSSファイル削除エラーは警告レベルでログ出力し、設定更新は継続
          this.logger.warn(
            `古いRSSファイルの削除に失敗しましたが、RSS設定は無効化されました: ${updatedAppUser.id}`,
            deleteError,
          );
        }
      }

      // RSS有効化時にRSSファイルを生成・アップロード
      if (params.rssEnabled && !wasRssEnabled) {
        try {
          this.logger.log(
            `RSS有効化によりRSSファイルを生成・アップロードします: ${updatedAppUser.id}`,
          );
          await this.rssFileService.generateAndUploadUserRss(updatedAppUser);
          this.logger.log(
            `RSSファイルの生成・アップロードが完了しました: ${updatedAppUser.id}`,
          );
        } catch (rssError) {
          // RSSファイル生成・アップロードエラーは警告レベルでログ出力し、設定更新は継続
          this.logger.warn(
            `RSSファイルの生成・アップロードに失敗しましたが、RSS設定は有効化されました: ${updatedAppUser.id}`,
            rssError,
          );
        }
      }

      const userSettings =
        await this.userSettingsRepository.findByAppUser(updatedAppUser);

      this.logger.log(`RSS設定を更新しました: ${appUser.id}`);
      return userSettings;
    } catch (error) {
      const errorMessage = `RSS設定の更新に失敗しました: ${appUser.id}`;
      this.logger.error(errorMessage, error);
      throw new UserSettingsUpdateError(errorMessage, { cause: error });
    }
  }

  /**
   * RSSトークンを再生成する
   * @param appUser 対象ユーザー
   * @returns RSSトークン再生成結果
   * @throws UserSettingsUpdateError RSS機能が無効またはトークン再生成に失敗した場合
   */
  async regenerateRssToken(
    appUser: AppUser,
  ): Promise<RssTokenRegenerationResult> {
    try {
      if (!appUser.rssEnabled) {
        throw new UserSettingsUpdateError(
          `RSS機能が無効なユーザーです: ${appUser.id}`,
        );
      }

      this.logger.log(`RSSトークンを再生成します: ${appUser.id}`);

      const oldRssToken = appUser.rssToken;
      const newRssToken = uuidv4();
      const updatedAppUser = await this.appUserRepository.regenerateRssToken(
        appUser.id,
        newRssToken,
      );

      // 古いRSSファイルを削除（古いトークンが存在する場合）
      if (oldRssToken) {
        try {
          this.logger.log(
            `RSSトークン再生成により古いRSSファイルを削除します: ${updatedAppUser.id}`,
          );
          await this.rssFileService.deleteUserRssFile(
            oldRssToken,
            updatedAppUser.id,
          );
          this.logger.log(
            `古いRSSファイルの削除が完了しました: ${updatedAppUser.id}`,
          );
        } catch (deleteError) {
          // RSSファイル削除エラーは警告レベルでログ出力し、処理は継続
          this.logger.warn(
            `古いRSSファイルの削除に失敗しましたが、RSSトークン再生成は継続します: ${updatedAppUser.id}`,
            deleteError,
          );
        }
      }

      // 新しいRSSファイルを生成・アップロード
      try {
        this.logger.log(
          `RSSトークン再生成により新しいRSSファイルを生成・アップロードします: ${updatedAppUser.id}`,
        );
        await this.rssFileService.generateAndUploadUserRss(updatedAppUser);
        this.logger.log(
          `新しいRSSファイルの生成・アップロードが完了しました: ${updatedAppUser.id}`,
        );
      } catch (rssError) {
        // RSSファイル生成・アップロードエラーは警告レベルでログ出力し、トークン再生成は継続
        this.logger.warn(
          `新しいRSSファイルの生成・アップロードに失敗しましたが、RSSトークンは再生成されました: ${updatedAppUser.id}`,
          rssError,
        );
      }

      const result: RssTokenRegenerationResult = {
        rssToken: updatedAppUser.rssToken!,
        rssUrl: this.buildRssUrl(updatedAppUser.rssToken!),
        rssCreatedAt: updatedAppUser.rssCreatedAt!,
      };

      this.logger.log(`RSSトークンを再生成しました: ${appUser.id}`);
      return result;
    } catch (error) {
      const errorMessage = `RSSトークンの再生成に失敗しました: ${appUser.id}`;
      this.logger.error(errorMessage, error);
      throw new UserSettingsUpdateError(errorMessage, { cause: error });
    }
  }

  /**
   * RSS URLを取得する
   * @param appUser 対象ユーザー
   * @returns RSS URL（RSS機能が無効またはトークンがない場合はundefined）
   */
  getRssUrl(appUser: AppUser): string | undefined {
    if (!appUser.rssEnabled || !appUser.rssToken) {
      return undefined;
    }
    return this.buildRssUrl(appUser.rssToken);
  }

  /**
   * RSSトークンからRSS配信URLを構築する
   * @param rssToken RSSトークン
   * @returns RSS配信URL
   */
  private buildRssUrl(rssToken: string): string {
    const rssUrlPrefix = this.appConfigService.RssUrlPrefix;
    return `${rssUrlPrefix}/u/${rssToken}/rss.xml`;
  }
}
