import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { SubscriptionRepository } from '../../infrastructure/database/subscription/subscription.repository';
import { SubscriptionListener } from './subscription.listener';
import { SubscriptionService } from './subscription.service';

@Module({
  imports: [EventEmitterModule.forRoot()],
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
