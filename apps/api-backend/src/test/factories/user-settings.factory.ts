import { UserSettings } from '@/domains/user-settings/user-settings.entity';

/**
 * ユーザー設定のモックデータを作成するファクトリークラス
 */
export class UserSettingsFactory {
  /**
   * 基本的なユーザー設定モックデータを作成する
   * @param overrides 上書きするプロパティ
   * @returns UserSettings
   */
  static createUserSettings(
    overrides: Partial<UserSettings> = {},
  ): UserSettings {
    return {
      userId: 'user-1',
      displayName: 'Test User',
      slackWebhookUrl: undefined,
      notificationEnabled: false,
      updatedAt: new Date('2023-01-01'),
      ...overrides,
    };
  }

  /**
   * Slack通知設定済みのユーザー設定を作成する
   * @param overrides 上書きするプロパティ
   * @returns UserSettings
   */
  static createUserSettingsWithSlack(
    overrides: Partial<UserSettings> = {},
  ): UserSettings {
    return this.createUserSettings({
      slackWebhookUrl:
        'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
      notificationEnabled: true,
      ...overrides,
    });
  }

  /**
   * 通知無効のユーザー設定を作成する
   * @param overrides 上書きするプロパティ
   * @returns UserSettings
   */
  static createUserSettingsWithNotificationDisabled(
    overrides: Partial<UserSettings> = {},
  ): UserSettings {
    return this.createUserSettings({
      slackWebhookUrl: undefined,
      notificationEnabled: false,
      ...overrides,
    });
  }

  /**
   * カスタム表示名のユーザー設定を作成する
   * @param displayName 表示名
   * @param overrides 上書きするプロパティ
   * @returns UserSettings
   */
  static createUserSettingsWithDisplayName(
    displayName: string,
    overrides: Partial<UserSettings> = {},
  ): UserSettings {
    return this.createUserSettings({
      displayName,
      ...overrides,
    });
  }
}
