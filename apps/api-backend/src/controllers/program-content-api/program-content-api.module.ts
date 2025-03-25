import { HeadlineTopicProgramsRepository } from '@/infrastructure/database/headline-topic-programs/headline-topic-programs.repository';
import { Module } from '@nestjs/common';
import { PrismaModule } from '@tech-post-cast/database';
import {
  LegacyApiV1Controller,
  ProgramContentApiController,
} from './program-content-api.controller';
import { ProgramContentApiService } from './program-content-api.service';

@Module({
  imports: [PrismaModule],
  controllers: [ProgramContentApiController, LegacyApiV1Controller],
  providers: [
    ProgramContentApiService,
    {
      provide: 'HeadlineTopicProgramsRepository',
      useClass: HeadlineTopicProgramsRepository,
    },
  ],
})
export class ProgramContentApiModule {}
