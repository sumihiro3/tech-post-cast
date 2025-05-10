import {
  Injectable,
  Logger,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { SubscriptionStatus } from '@tech-post-cast/database';
import { NextFunction, Request, Response } from 'express';
import { SubscriptionService } from '../domains/subscription/subscription.service';

/**
 * サブスクリプション状態をチェックし、リクエストにサブスクリプション情報を追加するミドルウェア
 */
@Injectable()
export class SubscriptionMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SubscriptionMiddleware.name);

  constructor(private subscriptionService: SubscriptionService) {}

  /**
   * ミドルウェアのメイン処理
   * @param req - リクエストオブジェクト
   * @param res - レスポンスオブジェクト
   * @param next - 次のミドルウェアを呼び出す関数
   */
  async use(req: Request, res: Response, next: NextFunction) {
    if (req.user) {
      this.logger.debug(`Checking subscription for user: ${req.user.id}`);

      try {
        const status = await this.subscriptionService.getSubscriptionStatus(
          req.user.id,
        );
        const limits = await this.subscriptionService.getPlanLimits(
          req.user.id,
        );

        req['subscriptionStatus'] = status;
        req['subscriptionLimits'] = limits;

        this.logger.debug(
          `Subscription status for user ${req.user.id}: ${status}`,
        );

        // サブスクリプションが期限切れの場合
        if (status === SubscriptionStatus.EXPIRED) {
          this.logger.warn(`Subscription expired for user: ${req.user.id}`);
          throw new UnauthorizedException({
            code: 'SUBSCRIPTION_EXPIRED',
            message:
              'サブスクリプションの期限が切れています。プランの更新が必要です。',
          });
        }

        // サブスクリプションが未購入の場合
        if (status === SubscriptionStatus.NONE) {
          this.logger.warn(`No subscription for user: ${req.user.id}`);
          throw new UnauthorizedException({
            code: 'SUBSCRIPTION_NONE',
            message: 'サブスクリプションがありません。プランの購入が必要です。',
          });
        }
      } catch (error) {
        if (error instanceof UnauthorizedException) {
          throw error;
        }
        // その他のエラーは500エラーとして返す
        this.logger.error(
          `Failed to check subscription for user: ${req.user.id}`,
          error.stack,
        );
        throw new UnauthorizedException({
          code: 'SUBSCRIPTION_CHECK_FAILED',
          message: 'サブスクリプションの確認に失敗しました。',
        });
      }
    }
    next();
  }
}
