import { PersonalizedFeedsService } from '@/domains/personalized-feeds/personalized-feeds.service';
import { AppUsersRepository } from '@/infrastructure/database/app-users/app-users.repository';
import { PersonalizedFeedsRepository } from '@/infrastructure/database/personalized-feeds/personalized-feeds.repository';
import { SubscriptionRepository } from '@infrastructure/database/subscription/subscription.repository';
import { Module } from '@nestjs/common';
import { PrismaModule } from '@tech-post-cast/database';
import { PersonalizedFeedsController } from './personalized-feeds.controller';

@Module({
  controllers: [PersonalizedFeedsController],
  imports: [PrismaModule],
  providers: [
    PersonalizedFeedsService,
    {
      provide: 'SubscriptionRepository',
      useClass: SubscriptionRepository,
    },
    {
      provide: 'PersonalizedFeedsRepository',
      useClass: PersonalizedFeedsRepository,
    },
    {
      provide: 'AppUsersRepository',
      useClass: AppUsersRepository,
    },
  ],
  exports: [PersonalizedFeedsService],
})
export class PersonalizedFeedsModule {}
