import { PersonalizedFeedFilterMapper } from '@domains/radio-program/personalized-feed/personalized-feed-filter.mapper';
import { PersonalizedFeedsService } from '@domains/radio-program/personalized-feed/personalized-feeds.service';
import { AppUsersRepository } from '@infrastructure/database/app-users/app-users.repository';
import { PersonalizedFeedsRepository } from '@infrastructure/database/personalized-feeds/personalized-feeds.repository';
import { QiitaPostsRepository } from '@infrastructure/database/qiita-posts/qiita-posts.repository';
import { QiitaPostsApiClient } from '@infrastructure/external-api/qiita-api/qiita-posts.api.client';
import { Module } from '@nestjs/common';
import { PrismaModule } from '@tech-post-cast/database';
import { PersonalizedFeedsController } from './personalized-feeds.controller';

@Module({
  imports: [PrismaModule],
  controllers: [PersonalizedFeedsController],
  providers: [
    PersonalizedFeedsService,
    PersonalizedFeedFilterMapper,
    {
      provide: 'PersonalizedFeedsRepository',
      useClass: PersonalizedFeedsRepository,
    },
    {
      provide: 'QiitaPostsRepository',
      useClass: QiitaPostsRepository,
    },
    {
      provide: 'AppUsersRepository',
      useClass: AppUsersRepository,
    },
    QiitaPostsApiClient,
  ],
})
export class PersonalizedFeedsModule {}
