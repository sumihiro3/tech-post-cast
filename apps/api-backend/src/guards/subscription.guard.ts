import { ISubscriptionRepository } from '@domains/subscription/subscription.repository.interface';
import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { SubscriptionStatus } from '@tech-post-cast/database';
import { Request } from 'express';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  private readonly logger = new Logger(SubscriptionGuard.name);

  constructor(
    @Inject('SubscriptionRepository')
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const userId = request.user?.id;

    if (!userId) {
      return true; // 認証されていないユーザーは別のガードで処理
    }

    try {
      this.logger.debug(
        `ユーザーID: ${userId} のサブスクリプション状態を確認します`,
      );
      // サブスクリプション状態を取得
      const subscriptionInfo =
        await this.subscriptionRepository.findByUserId(userId);
      const status = subscriptionInfo?.status ?? SubscriptionStatus.NONE;

      // リクエストにサブスクリプション情報を追加
      request.subscription = subscriptionInfo;

      // プレミアム機能へのアクセスチェック
      if (status !== SubscriptionStatus.ACTIVE) {
        this.logger.error(
          `ユーザーID: ${userId} のサブスクリプション状態が ${status} です`,
        );
        throw new UnauthorizedException(
          'この機能にアクセスするには有効なサブスクリプションが必要です',
        );
      }

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      // その他のエラーはアクセスを許可
      return true;
    }
  }
}
