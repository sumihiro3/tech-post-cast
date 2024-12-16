import { LineBotSignatureGuard } from '@/guards/line-bot/ine-bot-signature.guard';
import { webhook } from '@line/bot-sdk';
import { Body, Controller, Logger, Post, UseGuards } from '@nestjs/common';
import { LineBotService } from './line-bot.service';

@Controller('line-bot')
export class LineBotController {
  private readonly logger = new Logger(LineBotController.name);

  constructor(private readonly lineBotService: LineBotService) {}

  @Post()
  @UseGuards(LineBotSignatureGuard)
  async webhook(@Body() request: webhook.CallbackRequest): Promise<string> {
    this.logger.debug(`LineBotController.webhook() called`, {
      request,
    });
    const events: webhook.Event[] = request.events;
    if (events.length === 0) return 'No events';
    // Webhook イベントを処理
    await Promise.all(
      events.map(async (event) => {
        // 個々のイベント処理
        await this.lineBotService.handleWebhookEvent(event);
      }),
    );
    return 'OK';
  }
}
