import { NotificationBatchService } from '@domains/notification/notification-batch.service';
import { PersonalizedProgramAttemptsRepository } from '@infrastructure/database/personalized-program-attempts/personalized-program-attempts.repository';
import { Module } from '@nestjs/common';
import { PrismaModule } from '@tech-post-cast/database';
import { NotificationsController } from './notifications.controller';

@Module({
  imports: [PrismaModule],
  controllers: [NotificationsController],
  providers: [
    NotificationBatchService,
    {
      provide: 'PersonalizedProgramAttemptsRepository',
      useClass: PersonalizedProgramAttemptsRepository,
    },
  ],
  exports: [NotificationBatchService],
})
export class NotificationsModule {}
