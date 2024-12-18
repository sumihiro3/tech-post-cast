import { HeadlineTopicProgramMaker } from '@domains/radio-program/headline-topic-program/headline-topic-program-maker';
import { HeadlineTopicProgramsRepository } from '@infrastructure/database/headline-topic-programs/headline-topic-programs.repository';
import { QiitaPostsRepository } from '@infrastructure/database/qiita-posts/qiita-posts.repository';
import { S3ProgramFileUploader } from '@infrastructure/external-api/aws/s3';
import { OpenAiApiClient } from '@infrastructure/external-api/openai-api/openai-api.client';
import { QiitaPostsApiClient } from '@infrastructure/external-api/qiita-api/qiita-posts.api.client';
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
    QiitaPostsApiClient,
    HeadlineTopicProgramMaker,
    OpenAiApiClient,
    {
      provide: 'ProgramFileUploader',
      useClass: S3ProgramFileUploader,
    },
  ],
  exports: [HeadlineTopicProgramsService],
})
export class HeadlineTopicProgramsModule {}
