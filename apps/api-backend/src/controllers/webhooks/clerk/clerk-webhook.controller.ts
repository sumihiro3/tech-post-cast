import { WebhookEvent } from '@clerk/backend';
import { Controller, Headers, Logger, Post, UseGuards } from '@nestjs/common';
import { ClerkWebhookService } from './clerk-webhook.service';
import { ClerkWebhookEventGuardDecorator } from './decorators/clerk-webhook.guard.decorator';
import { ClerkWebhookGuard } from './guards/clerk-webhook.guard';

@Controller('api/webhooks/clerk')
@UseGuards(ClerkWebhookGuard)
export class ClerkWebhookController {
  private readonly logger = new Logger(ClerkWebhookController.name);

  constructor(private readonly clerkWebhookService: ClerkWebhookService) {}

  @Post()
  async handleWebhook(
    @Headers() headers: Record<string, string>,
    @ClerkWebhookEventGuardDecorator() webhook: WebhookEvent,
  ) {
    this.logger.log(`ClerkWebhookController.handleWebhook called!`, webhook);
    return this.clerkWebhookService.handleWebhook(headers, webhook);
  }
}
