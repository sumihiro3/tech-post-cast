import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CustomLoggerModule } from '@tech-post-cast/commons';
import { PrismaModule } from '@tech-post-cast/database';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventsModule } from './controllers/events/events.module';
import { HeadlineTopicProgramsModule } from './controllers/headline-topic-programs/headline-topic-programs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env`,
    }),
    CustomLoggerModule,
    PrismaModule,
    HeadlineTopicProgramsModule,
    EventsModule,
  ],
  controllers: [
    AppController,
    // SampleController // 実装確認時に使う Controller
  ],
  providers: [
    AppService,
    // OpenAiApiClient, QiitaPostsApiClient // SampleController で使うサービス
  ],
})
export class AppModule {}
