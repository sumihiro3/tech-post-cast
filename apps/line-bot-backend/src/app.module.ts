import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CustomLoggerModule } from '@tech-post-cast/commons';
import { AppConfigModule } from './app-config/app-config.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LineBotModule } from './controllers/line-bot/line-bot.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env`,
    }),
    AppConfigModule,
    CustomLoggerModule,
    LineBotModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
