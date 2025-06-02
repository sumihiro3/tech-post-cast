import { AppUser } from '@prisma/client';

/**
 * アプリユーザーのモックデータを作成するファクトリークラス
 */
export class AppUserFactory {
  /**
   * 単一のアプリユーザーモックデータを作成する
   * @param overrides 上書きするプロパティ
   * @returns AppUser
   */
  static createAppUser(overrides: Partial<AppUser> = {}): AppUser {
    return {
      id: 'user-1',
      firstName: 'Test',
      lastName: 'User',
      displayName: 'Test User',
      email: 'test@example.com',
      imageUrl: 'https://example.com/image.jpg',
      isActive: true,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      lastSignInAt: new Date('2023-01-01'),
      stripeCustomerId: 'stripe_customer_id',
      defaultPaymentMethodId: 'default_payment_method_id',
      slackWebhookUrl: null,
      notificationEnabled: false,
      ...overrides,
    };
  }

  /**
   * 複数のアプリユーザーモックデータを作成する
   * @param count 作成するユーザー数
   * @param overrides 上書きするプロパティ
   * @returns AppUser[]
   */
  static createAppUsers(
    count: number,
    overrides: Partial<AppUser> = {},
  ): AppUser[] {
    return Array.from({ length: count }, (_, index) =>
      this.createAppUser({
        id: `user-${index + 1}`,
        email: `test${index + 1}@example.com`,
        ...overrides,
      }),
    );
  }

  /**
   * Slack通知設定済みユーザーを作成する
   * @param overrides 上書きするプロパティ
   * @returns AppUser
   */
  static createUserWithSlackNotification(
    overrides: Partial<AppUser> = {},
  ): AppUser {
    return this.createAppUser({
      slackWebhookUrl:
        'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
      notificationEnabled: true,
      ...overrides,
    });
  }

  /**
   * 通知無効ユーザーを作成する
   * @param overrides 上書きするプロパティ
   * @returns AppUser
   */
  static createUserWithNotificationDisabled(
    overrides: Partial<AppUser> = {},
  ): AppUser {
    return this.createAppUser({
      slackWebhookUrl: null,
      notificationEnabled: false,
      ...overrides,
    });
  }
}
