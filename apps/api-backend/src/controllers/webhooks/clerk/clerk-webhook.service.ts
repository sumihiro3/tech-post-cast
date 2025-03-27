import { Injectable, Logger } from '@nestjs/common';
import { PrismaClientManager } from '@tech-post-cast/database';

@Injectable()
export class ClerkWebhookService {
  private readonly logger = new Logger(ClerkWebhookService.name);

  constructor(private readonly prisma: PrismaClientManager) {}

  async handleWebhook(
    headers: Record<string, string>,
    payload: any,
  ): Promise<void> {
    // TODO: Implement webhook handling logic
    this.logger.log('Received webhook:', payload);
  }
}
