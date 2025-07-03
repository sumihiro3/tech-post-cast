import { clerkClient } from '@clerk/clerk-sdk-node';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SubscriptionStatus } from '@tech-post-cast/database';
import { SUBSCRIPTION_EVENTS } from './subscription.constants';

/**
 * サブスクリプション関連のイベントを処理するリスナー
 */
@Injectable()
export class SubscriptionListener {
  private readonly logger = new Logger(SubscriptionListener.name);

  /**
   * サブスクリプション状態変更イベントを処理する
   * @param payload - イベントペイロード
   */
  @OnEvent(SUBSCRIPTION_EVENTS.STATUS_CHANGED)
  async handleSubscriptionStatusChanged(payload: {
    userId: string;
    status: SubscriptionStatus;
    timestamp: Date;
  }) {
    this.logger.debug(
      `SubscriptionListener.handleSubscriptionStatusChanged called`,
      {
        userId: payload.userId,
        status: payload.status,
        timestamp: payload.timestamp,
      },
    );

    try {
      // ユーザーの認証メタデータを更新
      await this.updateUserAuthMetadata(payload.userId, payload.status);

      // TODO: WebSocketによる通知実装
      // TODO: クライアントに通知して、必要に応じてUIを更新
      this.logger.log(
        `ユーザー [${payload.userId}] のサブスクリプションステータス変更を正常に処理しました`,
      );
    } catch (error) {
      this.logger.error(
        `ユーザー [${payload.userId}] のサブスクリプションステータス変更の処理に失敗しました`,
        error.stack,
      );
      // エラーはログに記録するだけで、イベント処理は継続
    }
  }

  /**
   * ユーザーの認証メタデータを更新する
   * @param userId - ユーザーID
   * @param status - サブスクリプションステータス
   */
  private async updateUserAuthMetadata(
    userId: string,
    status: SubscriptionStatus,
  ): Promise<void> {
    this.logger.debug(`SubscriptionListener.updateUserAuthMetadata called`, {
      userId: userId,
      status: status,
    });
    try {
      const updatedUser = await clerkClient.users.updateUser(userId, {
        publicMetadata: {
          subscriptionStatus: status,
          lastStatusChange: new Date().toISOString(),
        },
      });
      this.logger.debug(`ユーザー [${userId}] の認証メタデータを更新しました`, {
        updatedUser,
      });
    } catch (error) {
      this.logger.error(
        `ユーザー [${userId}] の認証メタデータの更新に失敗しました`,
        error.stack,
      );
      throw error;
    }
  }
}
