import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { QiitaPostsRepository } from './infrastructure/database/qiita-posts/qiita-posts.repository';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env`,
    }),
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [AppService, QiitaPostsRepository],
})
export class AppModule {}
