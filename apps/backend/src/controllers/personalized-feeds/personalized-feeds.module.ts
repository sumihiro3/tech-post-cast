import { PersonalizedFeedFilterMapper } from '@domains/radio-program/personalized-feed/personalized-feed-filter.mapper';
import { PersonalizedFeedsBuilder } from '@domains/radio-program/personalized-feed/personalized-feeds-builder';
import { AppUsersRepository } from '@infrastructure/database/app-users/app-users.repository';
import { PersonalizedFeedsRepository } from '@infrastructure/database/personalized-feeds/personalized-feeds.repository';
import { QiitaPostsRepository } from '@infrastructure/database/qiita-posts/qiita-posts.repository';
import { TermsRepository } from '@infrastructure/database/terms/terms.repository';
import { S3ProgramFileUploader } from '@infrastructure/external-api/aws/s3';
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
    TermsRepository,
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
    {
      provide: 'ProgramFileMaker',
      useClass: FfmpegProgramFileMaker,
    },
    {
      provide: 'ProgramFileUploader',
      useClass: S3ProgramFileUploader,
    },
    {
      provide: 'TextToSpeechClient',
      useClass: TextToSpeechClient,
    },
    QiitaPostsApiClient,
  ],
})
export class PersonalizedFeedsModule {}
