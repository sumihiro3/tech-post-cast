import { AppConfigModule } from '@/app-config/app-config.module';
import { ApiV1Module } from '@/controllers/api-v1/api-v1.module';
import { ProgramContentApiModule } from '@/controllers/program-content-api/program-content-api.module';
import { QiitaPostsModule } from '@/controllers/qiita-posts/qiita-posts.module';
import { ClerkWebhookModule } from '@/controllers/webhooks/clerk/clerk-webhook.module';
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  CustomLoggerModule,
  RequestLoggingMiddleware,
} from '@tech-post-cast/commons';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env`,
    }),
    CustomLoggerModule,
    AppConfigModule,
    ProgramContentApiModule,
    ApiV1Module,
    ClerkWebhookModule,
    QiitaPostsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggingMiddleware).forRoutes('');
  }
}
