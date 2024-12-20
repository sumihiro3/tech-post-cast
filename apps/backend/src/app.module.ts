import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  CustomLoggerModule,
  RequestLoggingMiddleware,
} from '@tech-post-cast/commons';
import { PrismaModule } from '@tech-post-cast/database';
import { AppConfigModule } from './app-config/app-config.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApiV1Module } from './controllers/api-v1/api-v1.module';
import { EventsModule } from './controllers/events/events.module';
import { HeadlineTopicProgramsModule } from './controllers/headline-topic-programs/headline-topic-programs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env`,
    }),
    AppConfigModule,
    CustomLoggerModule,
    PrismaModule,
    HeadlineTopicProgramsModule,
    EventsModule,
    ApiV1Module,
    // 実装確認時に使う Module（デプロイする際にはコメントアウトしておくこと）
    // SampleModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggingMiddleware).forRoutes('');
  }
}
