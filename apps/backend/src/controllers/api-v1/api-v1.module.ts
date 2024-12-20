import { Module } from '@nestjs/common';
import { ApiV1Controller } from './api-v1.controller';
import { ApiV1Service } from './api-v1.service';

@Module({
  controllers: [ApiV1Controller],
  providers: [ApiV1Service],
})
export class ApiV1Module {}
