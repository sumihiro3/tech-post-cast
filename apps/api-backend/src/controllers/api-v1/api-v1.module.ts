import { HeadlineTopicProgramsRepository } from '@/infrastructure/database/headline-topic-programs/headline-topic-programs.repository';
import { Module } from '@nestjs/common';
import { PrismaModule } from '@tech-post-cast/database';
import { ApiV1Controller } from './api-v1.controller';
import { ApiV1Service } from './api-v1.service';

@Module({
  imports: [PrismaModule],
  controllers: [ApiV1Controller],
  providers: [
    ApiV1Service,
    {
      provide: 'HeadlineTopicProgramsRepository',
      useClass: HeadlineTopicProgramsRepository,
    },
  ],
})
export class ApiV1Module {}
