import { AppConfigModule } from '@/app-config/app-config.module';
import { AuthModule } from '@/auth/auth.module';
import { ApiV1Module } from '@/controllers/api-v1/api-v1.module';
import { PersonalizedFeedsModule } from '@/controllers/personalized-feeds/personalized-feeds.module';
import { ProgramContentApiModule } from '@/controllers/program-content-api/program-content-api.module';
import { QiitaPostsModule } from '@/controllers/qiita-posts/qiita-posts.module';
import { ClerkWebhookModule } from '@/controllers/webhooks/clerk/clerk-webhook.module';
import { SubscriptionMiddleware } from '@/middlewares/subscription.middleware';
import { SubscriptionService } from '@domains/subscription/subscription.service';
import { SubscriptionRepository } from '@infrastructure/database/subscription/subscription.repository';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CustomLoggerModule } from '@tech-post-cast/commons';
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
    AuthModule,
    ProgramContentApiModule,
    ApiV1Module,
    ClerkWebhookModule,
    QiitaPostsModule,
    PersonalizedFeedsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: 'SubscriptionRepository',
      useClass: SubscriptionRepository,
    },
    SubscriptionService,
  ],
  exports: [SubscriptionService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SubscriptionMiddleware).forRoutes('*');
  }
}
