import { SubscriptionService } from '@domains/subscription/subscription.service';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SubscriptionStatus } from '@tech-post-cast/database';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private subscriptionService: SubscriptionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException(`ユーザーが認証されていません`);
    }
    // サブスクリプション情報を取得
    const status = await this.subscriptionService.getSubscriptionStatus(
      user.id,
    );
    const limits = await this.subscriptionService.getPlanLimits(user.id);

    // サブスクリプションがアクティブでない場合はエラーを返す
    if (status !== SubscriptionStatus.ACTIVE) {
      throw new UnauthorizedException(
        `アクティブなサブスクリプションが必要です`,
      );
    }
    request.subscriptionLimits = limits;
    return true;
  }
}
