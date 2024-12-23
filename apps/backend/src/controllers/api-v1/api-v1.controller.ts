import { ApiV1ApiKeyGuard } from '@/guards/api-key.guard';
import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HeadlineTopicProgram } from '@prisma/client';
import { ApiV1Service } from './api-v1.service';
import {
  HeadlineTopicProgramDto,
  HeadlineTopicProgramsFindRequestDto,
} from './dto';

@Controller('api/v1')
@ApiTags('ApiV1')
export class ApiV1Controller {
  private readonly logger = new Logger(ApiV1Controller.name);

  constructor(private readonly service: ApiV1Service) {}

  @Get('headline-topic-programs/:id')
  @ApiOperation({
    operationId: 'ApiV1_getHeadlineTopicProgram',
    summary: '指定のヘッドライントピック番組を取得する',
  })
  @ApiHeader({
    name: 'x-api-key',
    description: 'API Key',
    example: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: '処理成功',
    type: HeadlineTopicProgramDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @UseGuards(ApiV1ApiKeyGuard)
  async getHeadlineTopicProgram(
    @Param('id') id: string,
  ): Promise<HeadlineTopicProgramDto> {
    this.logger.debug('ApiV1Controller.getHeadlineTopicProgram called', {
      id,
    });
    try {
      // 指定のヘッドライントピック番組を取得
      const result = await this.service.getHeadlineTopicProgram(id);
      this.logger.log(`指定のヘッドライントピック番組 [${id}] を取得しました`, {
        title: result.title,
        createdAt: result.createdAt,
      });
      if (!result) {
        const errorMessage = `指定のヘッドライントピック番組 [${id}] が見つかりません`;
        this.logger.error(errorMessage);
        throw new NotFoundException(errorMessage);
      }
      // DTO へ変換
      const dto = HeadlineTopicProgramDto.createFromEntity(result);
      return dto;
    } catch (error) {
      const errorMessage = 'ヘッドライントピック番組の取得に失敗しました';
      this.logger.error(errorMessage, error, error.stack);
      throw new InternalServerErrorException(errorMessage);
    }
  }

  @Get('headline-topic-programs/count')
  @ApiOperation({
    operationId: 'ApiV1_getHeadlineTopicProgramsCounts',
    summary: 'ヘッドライントピック番組の件数を取得する',
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
  async getHeadlineTopicProgramsCounts(): Promise<number> {
    this.logger.debug('ApiV1Controller.getHeadlineTopicProgramsCounts called');
    try {
      const result = await this.service.getHeadlineTopicProgramsCounts();
      this.logger.log('ヘッドライントピック番組の件数を取得しました', {
        count: result,
      });
      return result;
    } catch (error) {
      const errorMessage = 'ヘッドライントピック番組の件数の取得に失敗しました';
      this.logger.error(errorMessage, error, error.stack);
      throw new InternalServerErrorException(errorMessage);
    }
  }

  @Get('headline-topic-programs')
  @ApiOperation({
    operationId: 'ApiV1_getHeadlineTopicPrograms',
    summary: 'ヘッドライントピック番組の一覧を取得する',
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
  async getHeadlineTopicPrograms(
    @Body() dto: HeadlineTopicProgramsFindRequestDto,
  ): Promise<HeadlineTopicProgram[]> {
    this.logger.debug('ApiV1Controller.getHeadlineTopicPrograms called', {
      dto,
    });
    try {
      const result = await this.service.getHeadlineTopicPrograms(dto);
      this.logger.log('ヘッドライントピック番組を取得しました', {
        count: result.length,
      });
      return result;
    } catch (error) {
      const errorMessage = 'ヘッドライントピック番組の取得に失敗しました';
      this.logger.error(errorMessage, error, error.stack);
      throw new InternalServerErrorException(errorMessage);
    }
  }
}
