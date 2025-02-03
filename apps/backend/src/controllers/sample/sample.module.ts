import { HeadlineTopicProgramsRepository } from '@infrastructure/database/headline-topic-programs/headline-topic-programs.repository';
import { S3ProgramFileUploader } from '@infrastructure/external-api/aws/s3';
import { OpenAiApiClient } from '@infrastructure/external-api/openai-api/openai-api.client';
import { QiitaPostsApiClient } from '@infrastructure/external-api/qiita-api/qiita-posts.api.client';
import { Module } from '@nestjs/common';
import { PrismaModule } from '@tech-post-cast/database';
import { SampleController } from './sample.controller';

@Module({
  imports: [PrismaModule],
  controllers: [
    SampleController, // 実装確認時に使う Controller
  ],
  providers: [
    OpenAiApiClient,
    QiitaPostsApiClient,
    {
      provide: 'ProgramFileUploader',
      useClass: S3ProgramFileUploader,
    },
    HeadlineTopicProgramsRepository,
  ],
})
export class SampleModule {}
