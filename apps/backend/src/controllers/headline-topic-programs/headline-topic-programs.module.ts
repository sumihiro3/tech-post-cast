import { HeadlineTopicProgramBuilder } from '@domains/radio-program/headline-topic-program/headline-topic-program-builder';
import { HeadlineTopicProgramsRepository } from '@infrastructure/database/headline-topic-programs/headline-topic-programs.repository';
import { QiitaPostsRepository } from '@infrastructure/database/qiita-posts/qiita-posts.repository';
import { TermsRepository } from '@infrastructure/database/terms/terms.repository';
import { S3ProgramFileUploader } from '@infrastructure/external-api/aws/s3';
import { TextToSpeechClient } from '@infrastructure/external-api/google/text-to-speech';
import { OpenAiApiClient } from '@infrastructure/external-api/openai-api/openai-api.client';
import { QiitaPostsApiClient } from '@infrastructure/external-api/qiita-api/qiita-posts.api.client';
import { TwitterApiClient } from '@infrastructure/external-api/x/twitter-api.client';
import { FfmpegProgramFileMaker } from '@infrastructure/ffmpeg/program-file-maker';
import { Module } from '@nestjs/common';
import { PrismaModule } from '@tech-post-cast/database';
import { HeadlineTopicProgramsController } from './headline-topic-programs.controller';
import { HeadlineTopicProgramsService } from './headline-topic-programs.service';

@Module({
  imports: [PrismaModule],
  controllers: [HeadlineTopicProgramsController],
  providers: [
    HeadlineTopicProgramsService,
    QiitaPostsRepository,
    HeadlineTopicProgramsRepository,
    TermsRepository,
    QiitaPostsApiClient,
    HeadlineTopicProgramBuilder,
    OpenAiApiClient,
    TwitterApiClient,
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
  ],
  exports: [HeadlineTopicProgramsService],
})
export class HeadlineTopicProgramsModule {}
