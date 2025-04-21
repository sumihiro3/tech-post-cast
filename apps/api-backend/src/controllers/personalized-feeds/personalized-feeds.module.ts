import { PersonalizedFeedsService } from '@/domains/personalized-feeds/personalized-feeds.service';
import { AppUserRepository } from '@/infrastructure/database/app-users/app-user.repository';
import { PersonalizedFeedsRepository } from '@/infrastructure/database/personalized-feeds/personalized-feeds.repository';
import { Module } from '@nestjs/common';
import { PrismaModule } from '@tech-post-cast/database';
import { PersonalizedFeedsController } from './personalized-feeds.controller';

@Module({
  controllers: [PersonalizedFeedsController],
  imports: [PrismaModule],
  providers: [
    PersonalizedFeedsService,
    {
      provide: 'IPersonalizedFeedsRepository',
      useClass: PersonalizedFeedsRepository,
    },
    {
      provide: 'IAppUserRepository',
      useClass: AppUserRepository,
    },
  ],
  exports: [PersonalizedFeedsService],
})
export class PersonalizedFeedsModule {}
