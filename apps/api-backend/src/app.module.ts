import { AppConfigModule } from '@/app-config/app-config.module';
import { AuthModule } from '@/auth/auth.module';
import { ApiV1Module } from '@/controllers/api-v1/api-v1.module';
import { DashboardModule } from '@/controllers/dashboard/dashboard.module';
import { PersonalizedFeedsModule } from '@/controllers/personalized-feeds/personalized-feeds.module';
import { ProgramContentApiModule } from '@/controllers/program-content-api/program-content-api.module';
import { QiitaPostsModule } from '@/controllers/qiita-posts/qiita-posts.module';
import { ClerkWebhookModule } from '@/controllers/webhooks/clerk/clerk-webhook.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CustomLoggerModule } from '@tech-post-cast/commons';
import { PrismaModule } from '@tech-post-cast/database';
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
    PrismaModule,
    EventEmitterModule.forRoot(),
    AuthModule,
    ProgramContentApiModule,
    ApiV1Module,
    ClerkWebhookModule,
    QiitaPostsModule,
    PersonalizedFeedsModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
