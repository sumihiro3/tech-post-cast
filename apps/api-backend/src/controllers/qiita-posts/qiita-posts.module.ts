import { AppConfigModule } from '@/app-config/app-config.module';
import { QiitaPostsService } from '@/domains/qiita-posts/qiita-posts.service';
import { QiitaPostsApiClient } from '@/infrastructure/external-api/qiita-api/qiita-posts.api.client';
import { Module } from '@nestjs/common';
import { QiitaPostsController } from './qiita-posts.controller';

@Module({
  imports: [AppConfigModule],
  controllers: [QiitaPostsController],
  providers: [
    QiitaPostsService,
    QiitaPostsApiClient,
    {
      provide: 'IQiitaPostsApiClient',
      useExisting: QiitaPostsApiClient,
    },
  ],
  exports: [QiitaPostsService],
})
export class QiitaPostsModule {}
