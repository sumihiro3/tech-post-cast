import { ApiV1ApiKeyGuard } from '@/guards/api-key.guard';
import { Controller, Get, Logger, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiV1Service } from './api-v1.service';

@Controller('api/v1')
@ApiTags('ApiV1')
export class ApiV1Controller {
  private readonly logger = new Logger(ApiV1Controller.name);

  constructor(private readonly service: ApiV1Service) {}

  @Get('headline-topic-programs')
  @ApiOperation({
    operationId: 'ApiV1_getHeadlineTopicPrograms',
    summary: 'Get headline topic programs',
  })
  @ApiHeader({
    name: 'x-api-key',
    description: 'API Key',
    example: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    required: true,
  })
  @ApiResponse({ status: 200, description: '処理成功' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @UseGuards(ApiV1ApiKeyGuard)
  async getHeadlineTopicPrograms() {
    this.logger.debug('ApiV1Controller.getHeadlineTopicPrograms called');
    return 'OK';
  }
}
