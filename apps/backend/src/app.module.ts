import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@tech-post-cast/database';
import { QiitaPostsRepository } from '@infrastructure/database/qiita-posts/qiita-posts.repository';
import { CustomLoggerModule } from '@tech-post-cast/commons';
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
  ],
  controllers: [AppController],
  providers: [AppService, QiitaPostsRepository],
})
export class AppModule {}
