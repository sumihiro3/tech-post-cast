import { Module } from '@nestjs/common';
import { HeadlineTopicProgramsController } from './headline-topic-programs.controller';
import { PrismaModule } from '@tech-post-cast/database';
import { HeadlineTopicProgramsService } from './headline-topic-programs.service';
import { QiitaPostsRepository } from '@/infrastructure/database/qiita-posts/qiita-posts.repository';
import { QiitaPostsApiClient } from '@/infrastructure/external-api/qiita-api/qiita-posts.api.client';
import { HeadlineTopicProgramMaker } from '@/domains/radio-program/headline-topic-program/headline-topic-program-maker';
import { OpenAiApiClient } from '@/infrastructure/external-api/openai-api/openai-api.client';

@Module({
  imports: [PrismaModule],
  controllers: [HeadlineTopicProgramsController],
  providers: [
    HeadlineTopicProgramsService,
    QiitaPostsRepository,
    QiitaPostsApiClient,
    HeadlineTopicProgramMaker,
    OpenAiApiClient,
  ],
})
export class HeadlineTopicProgramsModule {}
