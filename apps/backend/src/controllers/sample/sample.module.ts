import { S3ProgramFileUploader } from '@infrastructure/external-api/aws/s3';
import { OpenAiApiClient } from '@infrastructure/external-api/openai-api/openai-api.client';
import { QiitaPostsApiClient } from '@infrastructure/external-api/qiita-api/qiita-posts.api.client';
import { Module } from '@nestjs/common';
import { SampleController } from './sample.controller';

@Module({
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
  ],
})
export class SampleModule {}
