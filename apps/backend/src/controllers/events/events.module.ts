import { Module } from '@nestjs/common';
import { HeadlineTopicProgramsModule } from '../headline-topic-programs/headline-topic-programs.module';
import { EventsController } from './events.controller';

@Module({
  controllers: [EventsController],
  imports: [HeadlineTopicProgramsModule],
})
export class EventsModule {}
