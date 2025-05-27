import { AppUser, Plan, Subscription } from '@prisma/client';
import { UserWithSubscription } from '@tech-post-cast/database';

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
   * サブスクリプションモックデータを作成する
   * @param userId ユーザーID
   * @param planId プランID
   * @param overrides 上書きするプロパティ
   * @returns Subscription
   */
  static createSubscription(
    userId: string = 'user-1',
    planId: string = 'plan-1',
    overrides: Partial<Subscription> = {},
  ): Subscription {
    return {
      id: 'subscription-1',
      userId,
      planId,
      startDate: new Date('2023-01-01'),
      isActive: true,
      status: 'ACTIVE',
      endDate: new Date('2024-01-01'),
      cancelAt: null,
      canceledAt: null,
      trialStart: new Date('2023-01-01'),
      trialEnd: new Date('2023-01-15'),
      currentPeriodEnd: new Date('2023-02-01'),
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      stripeSubscriptionId: 'stripe_subscription_id',
      stripePriceId: 'stripe_price_id',
      currentPeriodStart: new Date('2023-01-01'),
      ...overrides,
    };
  }

  /**
   * プランモックデータを作成する
   * @param overrides 上書きするプロパティ
   * @returns Plan
   */
  static createPlan(overrides: Partial<Plan> = {}): Plan {
    return {
      id: 'plan-1',
      name: 'Free',
      price: 0,
      description: 'Free plan',
      maxFeeds: 10,
      maxAuthors: 10,
      maxTags: 10,
      programDuration: 30,
      stripePriceId: 'stripe_price_id',
      stripePriceType: 'stripe_price_type',
      billingInterval: 'billing_interval',
      isActive: true,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      ...overrides,
    };
  }

  /**
   * サブスクリプション付きユーザーモックデータを作成する
   * @param userOverrides ユーザー情報の上書きプロパティ
   * @param subscriptionOverrides サブスクリプション情報の上書きプロパティ
   * @param planOverrides プラン情報の上書きプロパティ
   * @returns UserWithSubscription
   */
  static createUserWithSubscription(
    userOverrides: Partial<AppUser> = {},
    subscriptionOverrides: Partial<Subscription> = {},
    planOverrides: Partial<Plan> = {},
  ): UserWithSubscription {
    const user = this.createAppUser(userOverrides);
    const plan = this.createPlan(planOverrides);
    const subscription = this.createSubscription(
      user.id,
      plan.id,
      subscriptionOverrides,
    );

    return {
      ...user,
      subscriptions: [
        {
          ...subscription,
          plan,
        },
      ],
    };
  }
}
