import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SubscriptionStatus } from '@tech-post-cast/database';
import { SUBSCRIPTION_EVENTS } from './subscription.constants';
import { ISubscriptionRepository } from './subscription.repository.interface';

/**
 * サブスクリプション関連のビジネスロジックを実装するサービス
 */
@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    @Inject('SubscriptionRepository')
    private subscriptionRepository: ISubscriptionRepository,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * ユーザーのサブスクリプションステータスを取得する
   * @param userId - ユーザーID
   * @returns サブスクリプションステータス
   */
  async getSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
    this.logger.debug(`SubscriptionService.getSubscriptionStatus called`, {
      userId,
    });

    const subscription = await this.subscriptionRepository.findByUserId(userId);
    return subscription?.status ?? SubscriptionStatus.NONE;
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
    this.logger.debug(`SubscriptionService.getPlanLimits called`, {
      userId,
    });

    return this.subscriptionRepository.getPlanLimits(userId);
  }

  /**
   * サブスクリプション履歴を記録する
   * @param userId - ユーザーID
   * @param status - サブスクリプションステータス
   * @param planId - プランID
   */
  async recordSubscriptionHistory(
    userId: string,
    status: SubscriptionStatus,
    planId: string,
  ): Promise<void> {
    this.logger.debug(`SubscriptionService.recordSubscriptionHistory called`, {
      userId,
      status,
      planId,
    });

    const { subscription: currentSubscription } =
      await this.subscriptionRepository.findCurrentSubscription(userId);

    if (!currentSubscription) {
      this.logger.warn(
        `ユーザー [${userId}] のアクティブなサブスクリプションが見つかりませんでした`,
      );
      return;
    }

    await this.subscriptionRepository.createSubscriptionHistory({
      subscriptionId: currentSubscription.id,
      userId,
      status,
      planId,
      startDate: new Date(),
    });
  }

  /**
   * サブスクリプション状態を更新する
   * @param userId - ユーザーID
   * @param status - 新しいサブスクリプションステータス
   * @param planId - プランID
   */
  async updateSubscriptionStatus(
    userId: string,
    status: SubscriptionStatus,
    planId: string,
  ): Promise<void> {
    this.logger.debug(`SubscriptionService.updateSubscriptionStatus called`, {
      userId,
      status,
      planId,
    });

    // サブスクリプション履歴を記録
    await this.recordSubscriptionHistory(userId, status, planId);

    // イベントを発行
    this.eventEmitter.emit(SUBSCRIPTION_EVENTS.STATUS_CHANGED, {
      userId,
      status,
      timestamp: new Date(),
    });

    this.logger.log(
      `ユーザー [${userId}] のサブスクリプションステータスを [${status}] に更新しました`,
    );
  }
}
