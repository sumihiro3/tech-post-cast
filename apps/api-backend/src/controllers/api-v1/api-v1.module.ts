import { HeadlineTopicProgramsRepository } from '@/infrastructure/database/headline-topic-programs/headline-topic-programs.repository';
import { Module } from '@nestjs/common';
import { PrismaModule } from '@tech-post-cast/database';
import { LegacyApiV1Controller } from '../program-content-api/program-content-api.controller';
import { ProgramContentApiService } from '../program-content-api/program-content-api.service';

@Module({
  imports: [PrismaModule],
  controllers: [LegacyApiV1Controller],
  providers: [
    ProgramContentApiService,
    {
      provide: 'HeadlineTopicProgramsRepository',
      useClass: HeadlineTopicProgramsRepository,
    },
  ],
})
export class ApiV1Module {}
