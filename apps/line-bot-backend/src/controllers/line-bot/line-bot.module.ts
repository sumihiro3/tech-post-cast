import { HeadlineTopicProgramsRepository } from '@infrastructure/database/headline-topic-programs/headline-topic-programs.repository';
import { Module } from '@nestjs/common';
import { PrismaModule } from '@tech-post-cast/database';
import { LineBotController } from './line-bot.controller';
import { LineBotService } from './line-bot.service';

@Module({
  imports: [PrismaModule],
  controllers: [LineBotController],
  providers: [LineBotService, HeadlineTopicProgramsRepository],
})
export class LineBotModule {}
