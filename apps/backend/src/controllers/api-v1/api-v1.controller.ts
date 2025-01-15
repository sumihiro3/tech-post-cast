import { ApiV1BearerTokenGuard } from '@/guards/bearer-token.guard';
import {
  Controller,
  Get,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiV1Service } from './api-v1.service';
import {
  HeadlineTopicProgramDto,
  HeadlineTopicProgramsCountDto,
  HeadlineTopicProgramsFindRequestDto,
} from './dto';

@Controller('api/v1')
@ApiTags('ApiV1')
export class ApiV1Controller {
  private readonly logger = new Logger(ApiV1Controller.name);

  constructor(private readonly service: ApiV1Service) {}

  @Get('headline-topic-programs/count')
  @ApiOperation({
    operationId: 'getHeadlineTopicProgramsCount',
    summary: 'ヘッドライントピック番組の件数を取得する',
  })
  @ApiHeader({
    name: 'authorization',
    description: 'Bearer Token',
    example: 'Bearer xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: '処理成功',
    type: HeadlineTopicProgramsCountDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @UseGuards(ApiV1BearerTokenGuard)
  async getHeadlineTopicProgramsCounts(): Promise<HeadlineTopicProgramsCountDto> {
    this.logger.debug('ApiV1Controller.getHeadlineTopicProgramsCounts called');
    try {
      const result = await this.service.getHeadlineTopicProgramsCounts();
      this.logger.log('ヘッドライントピック番組の件数を取得しました', {
        count: result,
      });
      const dto = new HeadlineTopicProgramsCountDto();
      dto.count = result;
      return dto;
    } catch (error) {
      const errorMessage = 'ヘッドライントピック番組の件数の取得に失敗しました';
      this.logger.error(errorMessage, error, error.stack);
      throw new InternalServerErrorException(errorMessage);
    }
  }

  @Get('headline-topic-programs')
  @ApiOperation({
    operationId: 'getHeadlineTopicPrograms',
    summary: 'ヘッドライントピック番組の一覧を取得する',
  })
  @ApiHeader({
    name: 'authorization',
    description: 'Bearer Token',
    example: 'Bearer xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: '処理成功',
    type: [HeadlineTopicProgramDto],
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @UseGuards(ApiV1BearerTokenGuard)
  async getHeadlineTopicPrograms(
    @Query() dto: HeadlineTopicProgramsFindRequestDto,
  ): Promise<HeadlineTopicProgramDto[]> {
    this.logger.debug('ApiV1Controller.getHeadlineTopicPrograms called', {
      dto,
    });
    try {
      const result = await this.service.getHeadlineTopicPrograms(dto);
      this.logger.log('ヘッドライントピック番組を取得しました', {
        count: result.length,
      });
      // DTO へ変換
      const dtoList = result.map((entity) =>
        HeadlineTopicProgramDto.createFromEntity(entity),
      );
      return dtoList;
    } catch (error) {
      const errorMessage = 'ヘッドライントピック番組の取得に失敗しました';
      this.logger.error(errorMessage, error, error.stack);
      throw new InternalServerErrorException(errorMessage);
    }
  }

  @Get('headline-topic-program-ids')
  @ApiOperation({
    operationId: 'getHeadlineTopicProgramIds',
    summary: 'ヘッドライントピック番組の番組ID一覧を取得する',
  })
  @ApiHeader({
    name: 'authorization',
    description: 'Bearer Token',
    example: 'Bearer xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: '処理成功',
    type: [String],
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @UseGuards(ApiV1BearerTokenGuard)
  async getHeadlineTopicProgramIds(): Promise<string[]> {
    this.logger.debug('ApiV1Controller.getHeadlineTopicProgramIds called');
    try {
      const result = await this.service.getHeadlineTopicProgramIds();
      this.logger.log('ヘッドライントピック番組の番組ID一覧を取得しました', {
        count: result.length,
      });
      return result;
    } catch (error) {
      const errorMessage =
        'ヘッドライントピック番組の番組ID一覧の取得に失敗しました';
      this.logger.error(errorMessage, error, error.stack);
      throw new InternalServerErrorException(errorMessage);
    }
  }

  @Get('headline-topic-programs/:id')
  @ApiOperation({
    operationId: 'getHeadlineTopicProgram',
    summary: '指定のヘッドライントピック番組を取得する',
  })
  @ApiHeader({
    name: 'authorization',
    description: 'Bearer Token',
    example: 'Bearer xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: '処理成功',
    type: HeadlineTopicProgramDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @UseGuards(ApiV1BearerTokenGuard)
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
}
