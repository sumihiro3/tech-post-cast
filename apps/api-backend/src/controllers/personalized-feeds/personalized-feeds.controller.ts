import { CurrentUserId } from '@/auth/decorators/current-user-id.decorator';
import { ClerkJwtGuard } from '@/auth/guards/clerk-jwt.guard';
import { PersonalizedFeedsService } from '@/domains/personalized-feeds/personalized-feeds.service';
import { UserNotFoundError } from '@/types/errors';
import {
  Body,
  Controller,
  Get,
  Logger,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  CreatePersonalizedFeedRequestDto,
  CreatePersonalizedFeedResponseDto,
  GetPersonalizedFeedResponseDto,
  GetPersonalizedFeedsRequestDto,
  GetPersonalizedFeedsResponseDto,
} from './dto';

@Controller('personalized-feeds')
@ApiTags('Personalized Feeds')
@UseGuards(ClerkJwtGuard) // クラスレベルで認証を適用
export class PersonalizedFeedsController {
  private readonly logger = new Logger(PersonalizedFeedsController.name);

  constructor(
    private readonly personalizedFeedsService: PersonalizedFeedsService,
  ) {}

  /**
   * ユーザーのパーソナライズフィード一覧を取得するAPI
   */
  @Get()
  @ApiOperation({
    summary: 'パーソナライズフィード一覧取得',
    description: 'ユーザーが登録したパーソナライズフィードの一覧を取得します',
    operationId: 'getPersonalizedFeeds',
  })
  @ApiResponse({
    status: 200,
    description: '取得成功',
    type: GetPersonalizedFeedsResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'ユーザーが存在しない',
  })
  async getPersonalizedFeeds(
    @Query() dto: GetPersonalizedFeedsRequestDto,
    @CurrentUserId() userId: string, // JWTトークンからユーザーIDを取得
  ): Promise<GetPersonalizedFeedsResponseDto> {
    this.logger.verbose(`PersonalizedFeedsController.getPersonalizedFeeds`, {
      userId,
      page: dto.page,
      perPage: dto.perPage,
    });

    try {
      // ユーザーのパーソナライズフィード一覧を取得
      const result = await this.personalizedFeedsService.findByUserId(
        userId,
        dto.page,
        dto.perPage,
      );
      // DTOに変換して返却
      return GetPersonalizedFeedsResponseDto.fromEntity(result);
    } catch (error) {
      // UserNotFoundErrorをNotFoundExceptionに変換
      if (error instanceof UserNotFoundError) {
        this.logger.warn(`ユーザーが見つかりません`, {
          userId,
          error: error.message,
        });
        throw new NotFoundException(error.message);
      }
      // その他のエラーはログ出力して再スロー
      this.logger.error(
        `パーソナライズフィード一覧の取得に失敗しました`,
        error,
      );
      throw error;
    }
  }

  /**
   * 指定されたIDのパーソナライズフィードを取得するAPI
   */
  @Get(':id')
  @ApiOperation({
    summary: '個別パーソナライズフィード取得',
    description: '指定されたIDのパーソナライズフィードを取得します',
    operationId: 'getPersonalizedFeed',
  })
  @ApiParam({
    name: 'id',
    description: 'パーソナライズフィードID',
    required: true,
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: '取得成功',
    type: GetPersonalizedFeedResponseDto,
  })
  @ApiResponse({
    status: 404,
    description:
      'パーソナライズフィードが存在しない、またはユーザーが存在しない',
  })
  async getPersonalizedFeed(
    @Param('id') id: string,
    @CurrentUserId() userId: string, // JWTトークンからユーザーIDを取得
  ): Promise<GetPersonalizedFeedResponseDto> {
    this.logger.verbose(`PersonalizedFeedsController.getPersonalizedFeed`, {
      id,
      userId,
    });

    try {
      // 指定されたIDのパーソナライズフィードを取得
      const feed = await this.personalizedFeedsService.findById(id, userId);
      // DTOに変換して返却
      return GetPersonalizedFeedResponseDto.fromEntity(feed);
    } catch (error) {
      // NotFoundExceptionはそのまま再スロー
      if (error instanceof NotFoundException) {
        throw error;
      }

      // UserNotFoundErrorをNotFoundExceptionに変換
      if (error instanceof UserNotFoundError) {
        this.logger.warn(`ユーザーが見つかりません`, {
          userId,
          error: error.message,
        });
        throw new NotFoundException(error.message);
      }

      // その他のエラーはログ出力して再スロー
      this.logger.error(`パーソナライズフィードの取得に失敗しました`, error);
      throw error;
    }
  }

  /**
   * パーソナライズフィードを新規作成するAPI
   */
  @Post()
  @ApiOperation({
    summary: 'パーソナライズフィード新規作成',
    description: 'パーソナライズフィードを新規作成します',
    operationId: 'createPersonalizedFeed',
  })
  @ApiResponse({
    status: 201,
    description: '作成成功',
    type: CreatePersonalizedFeedResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'ユーザーが存在しない',
  })
  @ApiResponse({
    status: 400,
    description: 'リクエストパラメータが不正',
  })
  async createPersonalizedFeed(
    @Body() dto: CreatePersonalizedFeedRequestDto,
    @CurrentUserId() userId: string, // JWTトークンからユーザーIDを取得
  ): Promise<CreatePersonalizedFeedResponseDto> {
    this.logger.verbose(`PersonalizedFeedsController.createPersonalizedFeed`, {
      userId,
      name: dto.name,
      dataSource: dto.dataSource,
    });

    try {
      // パーソナライズフィードを作成
      const feed = await this.personalizedFeedsService.create(
        userId,
        dto.name,
        dto.dataSource,
        dto.filterConfig,
        dto.deliveryConfig,
        dto.isActive,
      );

      // DTOに変換して返却
      return CreatePersonalizedFeedResponseDto.fromEntity(feed);
    } catch (error) {
      // UserNotFoundErrorをNotFoundExceptionに変換
      if (error instanceof UserNotFoundError) {
        this.logger.warn(`ユーザーが見つかりません`, {
          userId,
          error: error.message,
        });
        throw new NotFoundException(error.message);
      }

      // その他のエラーはログ出力して再スロー
      this.logger.error(`パーソナライズフィードの作成に失敗しました`, error);
      throw error;
    }
  }
}
