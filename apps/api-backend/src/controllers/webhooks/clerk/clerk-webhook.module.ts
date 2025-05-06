import { AppUsersRepository } from '@infrastructure/database/app-users/app-users.repository';
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
      useClass: AppUsersRepository,
    },
  ],
})
export class ClerkWebhookModule {}
