import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { Webhook } from 'svix';

@Injectable()
export class ClerkWebhookGuard implements CanActivate {
  private readonly logger = new Logger(ClerkWebhookGuard.name);
  private readonly webhook: Webhook;

  constructor() {
    const signingSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!signingSecret) {
      throw new Error('CLERK_WEBHOOK_SECRET が環境変数に設定されていません');
    }
    this.webhook = new Webhook(signingSecret);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.logger.debug('ClerkWebhookGuard.canActivate called!');
    const request = context.switchToHttp().getRequest<Request>();
    const headers = request.headers;

    // Svixのヘッダーを取得
    const svixId = headers['svix-id'];
    const svixTimestamp = headers['svix-timestamp'];
    const svixSignature = headers['svix-signature'];

    // ヘッダーの存在チェック
    if (!svixId || !svixTimestamp || !svixSignature) {
      throw new UnauthorizedException('Svix のヘッダーが不足しています');
    }

    try {
      // Webhookの検証
      const payload = JSON.stringify(request.body);
      this.webhook.verify(payload, {
        'svix-id': svixId as string,
        'svix-timestamp': svixTimestamp as string,
        'svix-signature': svixSignature as string,
      });
      return true;
    } catch (error) {
      const errorMessage = `Clerk からの Webhook の検証に失敗しました`;
      this.logger.error(errorMessage, error, request.body);
      if (error instanceof Error) {
        this.logger.error(error.message, error.stack);
      }
      throw new UnauthorizedException(errorMessage);
    }
  }
}
