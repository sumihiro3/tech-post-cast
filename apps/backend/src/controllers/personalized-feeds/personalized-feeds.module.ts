import { QiitaPostsRepository } from '@infrastructure/database/qiita-posts/qiita-posts.repository';
import { QiitaPostsApiClient } from '@infrastructure/external-api/qiita-api/qiita-posts.api.client';
import { Module } from '@nestjs/common';
import { PersonalizedFeedsController } from './personalized-feeds.controller';
import { PersonalizedFeedsService } from './personalized-feeds.service';

@Module({
  controllers: [PersonalizedFeedsController],
  providers: [
    PersonalizedFeedsService,
    QiitaPostsRepository,
    QiitaPostsApiClient,
  ],
})
export class PersonalizedFeedsModule {}
