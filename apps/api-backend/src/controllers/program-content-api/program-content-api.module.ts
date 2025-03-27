import { HeadlineTopicProgramsRepository } from '@/infrastructure/database/headline-topic-programs/headline-topic-programs.repository';
import { Module } from '@nestjs/common';
import { PrismaModule } from '@tech-post-cast/database';
import { ProgramContentApiController } from './program-content-api.controller';
import { ProgramContentApiService } from './program-content-api.service';

@Module({
  imports: [PrismaModule],
  controllers: [ProgramContentApiController],
  providers: [
    ProgramContentApiService,
    {
      provide: 'HeadlineTopicProgramsRepository',
      useClass: HeadlineTopicProgramsRepository,
    },
  ],
  exports: [ProgramContentApiService],
})
export class ProgramContentApiModule {}
