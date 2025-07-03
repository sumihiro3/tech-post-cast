import { PersonalRssService } from '@/domains/rss/personal-rss.service';
import { PersonalizedFeedFilterMapper } from '@domains/radio-program/personalized-feed/personalized-feed-filter.mapper';
import { PersonalizedFeedsBuilder } from '@domains/radio-program/personalized-feed/personalized-feeds-builder';
import { PersonalizedProgramAttemptsService } from '@domains/radio-program/personalized-feed/personalized-program-attempts.service';
import { AppUsersRepository } from '@infrastructure/database/app-users/app-users.repository';
import { PersonalizedFeedsRepository } from '@infrastructure/database/personalized-feeds/personalized-feeds.repository';
import { PersonalizedProgramAttemptsRepository } from '@infrastructure/database/personalized-program-attempts/personalized-program-attempts.repository';
import { QiitaPostsRepository } from '@infrastructure/database/qiita-posts/qiita-posts.repository';
import { TermsRepository } from '@infrastructure/database/terms/terms.repository';
import { S3ProgramFileUploader } from '@infrastructure/external-api/aws/s3';
import { S3RssFileUploader } from '@infrastructure/external-api/aws/s3/rss-file-uploader';
import { TextToSpeechClient } from '@infrastructure/external-api/google/text-to-speech';
import { QiitaPostsApiClient } from '@infrastructure/external-api/qiita-api/qiita-posts.api.client';
import { FfmpegProgramFileMaker } from '@infrastructure/ffmpeg/program-file-maker';
import { Module } from '@nestjs/common';
import { PrismaModule } from '@tech-post-cast/database';
import { PersonalizedFeedsController } from './personalized-feeds.controller';

@Module({
  imports: [PrismaModule],
  controllers: [PersonalizedFeedsController],
  providers: [
    PersonalizedFeedsBuilder,
    PersonalizedFeedFilterMapper,
    PersonalRssService,
    PersonalizedProgramAttemptsService,
    TermsRepository,
    {
      provide: 'PersonalizedFeedsRepository',
      useClass: PersonalizedFeedsRepository,
    },
    {
      provide: 'PersonalizedProgramAttemptsRepository',
      useClass: PersonalizedProgramAttemptsRepository,
    },
    {
      provide: 'QiitaPostsRepository',
      useClass: QiitaPostsRepository,
    },
    {
      provide: 'AppUsersRepository',
      useClass: AppUsersRepository,
    },
    {
      provide: 'ProgramFileMaker',
      useClass: FfmpegProgramFileMaker,
    },
    {
      provide: 'ProgramFileUploader',
      useClass: S3ProgramFileUploader,
    },
    {
      provide: 'RssFileUploader',
      useClass: S3RssFileUploader,
    },
    {
      provide: 'TextToSpeechClient',
      useClass: TextToSpeechClient,
    },
    QiitaPostsApiClient,
  ],
})
export class PersonalizedFeedsModule {}
