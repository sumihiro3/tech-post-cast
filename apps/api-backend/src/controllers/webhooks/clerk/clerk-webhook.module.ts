import { AppUserRepository } from '@infrastructure/database/app-users/app-user.repository';
import { Module } from '@nestjs/common';
import { PrismaModule } from '@tech-post-cast/database';
import { ClerkWebhookController } from './clerk-webhook.controller';
import { ClerkWebhookService } from './clerk-webhook.service';

@Module({
  imports: [PrismaModule],
  controllers: [ClerkWebhookController],
  providers: [
    ClerkWebhookService,
    {
      provide: 'AppUserRepository',
      useClass: AppUserRepository,
    },
  ],
})
export class ClerkWebhookModule {}
