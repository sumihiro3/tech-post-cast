import { ProgramContentApiBearerTokenGuard } from '@/guards/bearer-token.guard';
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
import {
  HeadlineTopicProgramDto,
  HeadlineTopicProgramsCountDto,
  HeadlineTopicProgramsFindRequestDto,
  HeadlineTopicProgramWithSimilarAndNeighborsDto,
} from '../program-content-api/dto';
import { ProgramContentApiService } from '../program-content-api/program-content-api.service';

/**
 * 後方互換性のために、旧エンドポイント（/api/v1/）へのリクエストを
 * 新エンドポイント（/api/program-content/）へ転送するためのコントローラー
 * @deprecated このコントローラーは後方互換性のために提供されています。新しいエンドポイント(/api/program-content/)を使用してください。
 */
@Controller('api/v1')
@ApiTags('CompatibilityApi')
export class LegacyApiV1Controller {
  private readonly logger = new Logger(LegacyApiV1Controller.name);

  constructor(private readonly service: ProgramContentApiService) {}

  @Get('headline-topic-programs/count')
  @ApiOperation({
    operationId: 'legacyGetHeadlineTopicProgramsCount',
    summary: '[非推奨] ヘッドライントピック番組の件数を取得する',
    deprecated: true,
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
  @UseGuards(ProgramContentApiBearerTokenGuard)
  async getHeadlineTopicProgramsCounts(): Promise<HeadlineTopicProgramsCountDto> {
    this.logger.debug(
      'LegacyApiV1Controller.getHeadlineTopicProgramsCounts called',
    );
    this.logger.warn(
      '非推奨のエンドポイント(/api/v1/)が使用されました。新しいエンドポイント(/api/program-content/)を使用してください。',
    );

    // 新しいサービスの対応するメソッドを呼び出し
    return this.service
      .getHeadlineTopicProgramsCounts()
      .then((count) => {
        const dto = new HeadlineTopicProgramsCountDto();
        dto.count = count;
        return dto;
      })
      .catch((error) => {
        const errorMessage =
          'ヘッドライントピック番組の件数の取得に失敗しました';
        this.logger.error(errorMessage, error, error.stack);
        throw new InternalServerErrorException(errorMessage);
      });
  }

  @Get('headline-topic-programs')
  @ApiOperation({
    operationId: 'legacyGetHeadlineTopicPrograms',
    summary: '[非推奨] ヘッドライントピック番組の一覧を取得する',
    deprecated: true,
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
  @UseGuards(ProgramContentApiBearerTokenGuard)
  async getHeadlineTopicPrograms(
    @Query() dto: HeadlineTopicProgramsFindRequestDto,
  ): Promise<HeadlineTopicProgramDto[]> {
    this.logger.debug('LegacyApiV1Controller.getHeadlineTopicPrograms called', {
      dto,
    });
    this.logger.warn(
      '非推奨のエンドポイント(/api/v1/)が使用されました。新しいエンドポイント(/api/program-content/)を使用してください。',
    );

    // 新しいサービスの対応するメソッドを呼び出し
    return this.service
      .getHeadlineTopicPrograms(dto)
      .then((result) => {
        return result.map((entity) =>
          HeadlineTopicProgramDto.createFromEntity(entity),
        );
      })
      .catch((error) => {
        const errorMessage = 'ヘッドライントピック番組の取得に失敗しました';
        this.logger.error(errorMessage, error, error.stack);
        throw new InternalServerErrorException(errorMessage);
      });
  }

  @Get('headline-topic-program-ids')
  @ApiOperation({
    operationId: 'legacyGetHeadlineTopicProgramIds',
    summary: '[非推奨] ヘッドライントピック番組の番組ID一覧を取得する',
    deprecated: true,
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
  @UseGuards(ProgramContentApiBearerTokenGuard)
  async getHeadlineTopicProgramIds(): Promise<string[]> {
    this.logger.debug(
      'LegacyApiV1Controller.getHeadlineTopicProgramIds called',
    );
    this.logger.warn(
      '非推奨のエンドポイント(/api/v1/)が使用されました。新しいエンドポイント(/api/program-content/)を使用してください。',
    );

    // 新しいサービスの対応するメソッドを呼び出し
    return this.service.getHeadlineTopicProgramIds().catch((error) => {
      const errorMessage =
        'ヘッドライントピック番組の番組ID一覧の取得に失敗しました';
      this.logger.error(errorMessage, error, error.stack);
      throw new InternalServerErrorException(errorMessage);
    });
  }

  @Get('headline-topic-programs/:id/similar-and-neighbors')
  @ApiOperation({
    operationId: 'legacyGetHeadlineTopicProgramWithSimilarAndNeighbors',
    summary:
      '[非推奨] 指定のヘッドライントピック番組と、その類似番組および、前後の日付の番組を取得する',
    deprecated: true,
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
    type: HeadlineTopicProgramWithSimilarAndNeighborsDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @UseGuards(ProgramContentApiBearerTokenGuard)
  async getHeadlineTopicProgramWithSimilarAndNeighbors(
    @Param('id') id: string,
  ): Promise<HeadlineTopicProgramWithSimilarAndNeighborsDto> {
    this.logger.debug(
      'LegacyApiV1Controller.getHeadlineTopicProgramWithSimilarAndNeighbors called',
      { id },
    );
    this.logger.warn(
      '非推奨のエンドポイント(/api/v1/)が使用されました。新しいエンドポイント(/api/program-content/)を使用してください。',
    );

    // 新しいサービスの対応するメソッドを呼び出し
    return this.service
      .getHeadlineTopicProgramWithSimilarAndNeighbors(id)
      .then((result) => {
        return HeadlineTopicProgramWithSimilarAndNeighborsDto.createFromEntity(
          result,
        );
      })
      .catch((error) => {
        const errorMessage =
          'ヘッドライントピック番組および、前後の番組の取得に失敗しました';
        this.logger.error(errorMessage, error, error.stack);
        throw new InternalServerErrorException(errorMessage);
      });
  }

  @Get('headline-topic-programs/:id')
  @ApiOperation({
    operationId: 'legacyGetHeadlineTopicProgram',
    summary: '[非推奨] 指定のヘッドライントピック番組を取得する',
    deprecated: true,
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
  @UseGuards(ProgramContentApiBearerTokenGuard)
  async getHeadlineTopicProgram(
    @Param('id') id: string,
  ): Promise<HeadlineTopicProgramDto> {
    this.logger.debug('LegacyApiV1Controller.getHeadlineTopicProgram called', {
      id,
    });
    this.logger.warn(
      '非推奨のエンドポイント(/api/v1/)が使用されました。新しいエンドポイント(/api/program-content/)を使用してください。',
    );

    // 新しいサービスの対応するメソッドを呼び出し
    return this.service
      .getHeadlineTopicProgram(id)
      .then((result) => {
        if (!result) {
          const errorMessage = `指定のヘッドライントピック番組 [${id}] が見つかりません`;
          this.logger.error(errorMessage);
          throw new NotFoundException(errorMessage);
        }
        return HeadlineTopicProgramDto.createFromEntity(result);
      })
      .catch((error) => {
        const errorMessage = 'ヘッドライントピック番組の取得に失敗しました';
        this.logger.error(errorMessage, error, error.stack);
        throw new InternalServerErrorException(errorMessage);
      });
  }
}

