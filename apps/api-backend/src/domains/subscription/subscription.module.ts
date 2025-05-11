import { Module } from '@nestjs/common';
import { PrismaModule } from '@tech-post-cast/database';
import { SubscriptionRepository } from '../../infrastructure/database/subscription/subscription.repository';
import { SubscriptionListener } from './subscription.listener';
import { SubscriptionService } from './subscription.service';

@Module({
  imports: [PrismaModule],
  providers: [
    SubscriptionService,
    SubscriptionListener,
    {
      provide: 'SubscriptionRepository',
      useClass: SubscriptionRepository,
    },
  ],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
