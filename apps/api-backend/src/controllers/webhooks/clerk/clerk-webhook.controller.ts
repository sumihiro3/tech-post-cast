import { ClerkWebhookGuard } from '@/guards/clerk-webhook.guard';
import {
  Body,
  Controller,
  Headers,
  Logger,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ClerkWebhookService } from './clerk-webhook.service';

@Controller('api/webhooks/clerk')
@UseGuards(ClerkWebhookGuard)
export class ClerkWebhookController {
  private readonly logger = new Logger(ClerkWebhookController.name);

  constructor(private readonly clerkWebhookService: ClerkWebhookService) {}

  @Post()
  async handleWebhook(
    @Headers() headers: Record<string, string>,
    @Body() payload: any,
  ) {
    this.logger.log(`ClerkWebhookController.handleWebhook called!`, payload);
    return this.clerkWebhookService.handleWebhook(headers, payload);
  }
}
