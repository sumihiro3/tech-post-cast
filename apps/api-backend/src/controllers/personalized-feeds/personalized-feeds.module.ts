import { PersonalizedFeedsService } from '@/domains/personalized-feeds/personalized-feeds.service';
import { PersonalizedFeedsRepository } from '@/infrastructure/database/personalized-feeds/personalized-feeds.repository';
import { Module } from '@nestjs/common';
import { PersonalizedFeedsController } from './personalized-feeds.controller';

@Module({
  controllers: [PersonalizedFeedsController],
  providers: [
    PersonalizedFeedsService,
    {
      provide: 'IPersonalizedFeedsRepository',
      useClass: PersonalizedFeedsRepository,
    },
  ],
  exports: [PersonalizedFeedsService],
})
export class PersonalizedFeedsModule {}
