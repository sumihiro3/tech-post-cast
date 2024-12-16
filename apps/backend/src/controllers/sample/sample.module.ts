import { OpenAiApiClient } from '@infrastructure/external-api/openai-api/openai-api.client';
import { QiitaPostsApiClient } from '@infrastructure/external-api/qiita-api/qiita-posts.api.client';
import { Module } from '@nestjs/common';
import { SampleController } from './sample.controller';

@Module({
  controllers: [
    SampleController, // 実装確認時に使う Controller
  ],
  providers: [
    OpenAiApiClient, // SampleController で使うサービス
    QiitaPostsApiClient, // SampleController で使うサービス
  ],
})
export class SampleModule {}
