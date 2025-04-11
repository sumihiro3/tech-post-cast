import { Module } from '@nestjs/common';
import { PrismaModule } from '@tech-post-cast/database';
import { ProgramContentApiModule } from '../program-content-api/program-content-api.module';
import { LegacyApiV1Controller } from './legacy-api-v1.controller';

@Module({
  imports: [PrismaModule, ProgramContentApiModule],
  controllers: [LegacyApiV1Controller],
})
export class ApiV1Module {}

