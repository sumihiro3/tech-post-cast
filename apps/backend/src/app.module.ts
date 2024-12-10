import { QiitaPostsRepository } from '@infrastructure/database/qiita-posts/qiita-posts.repository';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CustomLoggerModule } from '@tech-post-cast/commons';
import { PrismaModule } from '@tech-post-cast/database';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HeadlineTopicProgramsModule } from './controllers/headline-topic-programs/headline-topic-programs.module';
import { EventsModule } from './controllers/events/events.module';

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
  controllers: [AppController],
  providers: [AppService, QiitaPostsRepository],
})
export class AppModule {}
