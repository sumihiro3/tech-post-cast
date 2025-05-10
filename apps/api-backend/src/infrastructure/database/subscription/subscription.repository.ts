import { ISubscriptionRepository } from '@domains/subscription/subscription.repository.interface';
import { Injectable, Logger } from '@nestjs/common';
import { Plan, Subscription, SubscriptionHistory } from '@prisma/client';
import {
  PrismaClientManager,
  SubscriptionStatus,
} from '@tech-post-cast/database';
import { PlanNotFoundError } from '../../../types/errors';

/**
 * サブスクリプション関連のデータアクセスを実装するリポジトリ
 */
@Injectable()
export class SubscriptionRepository implements ISubscriptionRepository {
  private readonly logger = new Logger(SubscriptionRepository.name);

  constructor(private prismaClientManager: PrismaClientManager) {}

  /**
   * ユーザーIDに基づいてサブスクリプションを取得する
   * @param userId - ユーザーID
   * @returns サブスクリプション情報
   */
  async findByUserId(userId: string) {
    this.logger.debug(`SubscriptionRepository.findByUserId called`, {
      userId,
    });

    const prisma = await this.prismaClientManager.getClient();
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        isActive: true,
      },
      include: {
        plan: true,
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    if (!subscription) {
      return null;
    }

    return {
      id: subscription.id,
      userId: subscription.userId,
      status: subscription.status as SubscriptionStatus,
      plan: subscription.plan
        ? {
            id: subscription.plan.id,
            limits: {
              maxFeeds: subscription.plan.maxFeeds,
              maxAuthors: subscription.plan.maxAuthors,
              maxTags: subscription.plan.maxTags,
            },
          }
        : undefined,
    };
  }

  /**
   * サブスクリプションの履歴を記録する
   * @param data - サブスクリプション履歴データ
   */
  async createSubscriptionHistory(data: {
    subscriptionId: string;
    userId: string;
    planId: string;
    status: SubscriptionStatus;
    startDate: Date;
    endDate?: Date;
  }): Promise<SubscriptionHistory> {
    this.logger.debug(
      `SubscriptionRepository.createSubscriptionHistory called`,
      {
        data,
      },
    );

    const prisma = await this.prismaClientManager.getClient();
    const history = await prisma.subscriptionHistory.create({
      data: {
        subscription: { connect: { id: data.subscriptionId } },
        user: { connect: { id: data.userId } },
        plan: { connect: { id: data.planId } },
        status: data.status,
        startDate: data.startDate,
        endDate: data.endDate,
      },
    });

    this.logger.debug(
      `ユーザー [${data.userId}] のサブスクリプション履歴を作成しました`,
      {
        history,
      },
    );
    return history;
  }

  /**
   * ユーザーの現在のサブスクリプション情報を取得する
   * @param userId - ユーザーID
   * @returns 現在のサブスクリプション情報とプラン情報
   */
  async findCurrentSubscription(userId: string): Promise<{
    subscription: Subscription | null;
    plan: Plan | null;
    status: SubscriptionStatus;
  }> {
    this.logger.debug(`SubscriptionRepository.findCurrentSubscription called`, {
      userId,
    });

    const prisma = await this.prismaClientManager.getClient();
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        isActive: true,
      },
      include: {
        plan: true,
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    this.logger.debug(
      `ユーザー [${userId}] のサブスクリプション情報を取得しました`,
      {
        subscription,
      },
    );

    return {
      subscription: subscription || null,
      plan: subscription?.plan || null,
      status:
        (subscription?.status as SubscriptionStatus) || SubscriptionStatus.NONE,
    };
  }

  /**
   * ユーザーのプラン制限を取得する
   * @param userId - ユーザーID
   * @returns プランの制限値
   */
  async getPlanLimits(userId: string): Promise<{
    maxFeeds: number;
    maxAuthors: number;
    maxTags: number;
  }> {
    this.logger.debug(`SubscriptionRepository.getPlanLimits called`, {
      userId,
    });

    const prisma = await this.prismaClientManager.getClient();
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        isActive: true,
      },
      include: {
        plan: true,
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    if (!subscription?.plan) {
      const errorMessage = `ユーザー [${userId}] のアクティブなサブスクリプションが見つかりませんでした`;
      this.logger.error(errorMessage);
      // プランがない場合はエラーを返す
      throw new PlanNotFoundError(errorMessage);
    }

    return {
      maxFeeds: subscription.plan.maxFeeds,
      maxAuthors: subscription.plan.maxAuthors,
      maxTags: subscription.plan.maxTags,
    };
  }

  /**
   * 新しいサブスクリプションを作成する
   * @param data - サブスクリプションデータ
   * @returns 作成されたサブスクリプション履歴
   */
  async createSubscription(data: {
    userId: string;
    planId: string;
    startDate: Date;
    endDate?: Date;
  }): Promise<SubscriptionHistory> {
    this.logger.debug(`SubscriptionRepository.createSubscription called`, {
      data,
    });

    const prisma = await this.prismaClientManager.getClient();
    const subscription = await prisma.subscription.create({
      data: {
        userId: data.userId,
        planId: data.planId,
        startDate: data.startDate,
        endDate: data.endDate,
        isActive: true,
        status: SubscriptionStatus.ACTIVE,
      },
    });

    const history = await this.createSubscriptionHistory({
      subscriptionId: subscription.id,
      userId: data.userId,
      planId: data.planId,
      status: subscription.status as SubscriptionStatus,
      startDate: data.startDate,
      endDate: data.endDate,
    });

    this.logger.debug(
      `ユーザー [${data.userId}] のサブスクリプションを作成しました`,
      {
        subscription,
        history,
      },
    );

    return history;
  }
}
