import { CurrentUserId } from '@/auth/decorators/current-user-id.decorator';
import { ClerkJwtGuard } from '@/auth/guards/clerk-jwt.guard';
import { SubscriptionDecorator } from '@/decorators/subscription.decorator';
import { PersonalizedFeedsService } from '@/domains/personalized-feeds/personalized-feeds.service';
import {
  CreatePersonalizedFeedParams,
  UpdatePersonalizedFeedParams,
} from '@/domains/personalized-feeds/personalized-feeds.types';
import { SubscriptionGuard } from '@/guards/subscription.guard';
import {
  PersonalizedFeedCreationLimitError,
  UserNotFoundError,
} from '@/types/errors';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SubscriptionInfo } from '@tech-post-cast/database';
import {
  CreatePersonalizedFeedRequestDto,
  CreatePersonalizedFeedWithFiltersResponseDto,
  DeletePersonalizedFeedResponseDto,
  GetPersonalizedFeedWithFiltersResponseDto,
  GetPersonalizedFeedsRequestDto,
  GetPersonalizedFeedsResponseDto,
  GetPersonalizedFeedsWithFiltersResponseDto,
  UpdatePersonalizedFeedRequestDto,
  UpdatePersonalizedFeedWithFiltersResponseDto,
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
   * includeFilters=true の場合はフィルター情報も一緒に取得する
   */
  @Get()
  @ApiOperation({
    summary: 'パーソナライズフィード一覧取得',
    description:
      'ユーザーが登録したパーソナライズフィードの一覧を取得します。クエリパラメータincludeFilters=trueを指定するとフィルターグループ情報も一緒に取得できます。',
    operationId: 'getPersonalizedFeeds',
  })
  @ApiResponse({
    status: 200,
    description: '取得成功（フィルター情報なし）',
    type: GetPersonalizedFeedsResponseDto,
  })
  @ApiResponse({
    status: 200,
    description: '取得成功（フィルター情報あり）',
    type: GetPersonalizedFeedsWithFiltersResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'ユーザーが存在しない',
  })
  async getPersonalizedFeeds(
    @Query() dto: GetPersonalizedFeedsRequestDto,
    @CurrentUserId() userId: string, // JWTトークンからユーザーIDを取得
  ): Promise<
    GetPersonalizedFeedsResponseDto | GetPersonalizedFeedsWithFiltersResponseDto
  > {
    this.logger.debug(`PersonalizedFeedsController.getPersonalizedFeeds`, {
      userId,
      page: dto.page,
      perPage: dto.perPage,
      includeFilters: dto.includeFilters,
    });

    try {
      // フィルター情報を含める場合
      if (dto.includeFilters) {
        // ユーザーのパーソナライズフィード一覧をフィルター情報付きで取得
        const result =
          await this.personalizedFeedsService.findByUserIdWithFilters(
            userId,
            dto.page,
            dto.perPage,
          );
        // DTOに変換して返却
        return GetPersonalizedFeedsWithFiltersResponseDto.fromEntity(result);
      }

      // フィルター情報を含めない場合（デフォルト）
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
   * includeFilters=true の場合はフィルター情報も一緒に取得する
   */
  @Get(':id')
  @ApiOperation({
    summary: '個別パーソナライズフィード取得',
    description:
      '指定されたIDのパーソナライズフィードを取得します。クエリパラメータincludeFilters=trueを指定するとフィルターグループ情報も一緒に取得できます。',
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
    description: '取得成功（フィルター情報あり）',
    type: GetPersonalizedFeedWithFiltersResponseDto,
  })
  @ApiResponse({
    status: 404,
    description:
      'パーソナライズフィードが存在しない、またはユーザーが存在しない',
  })
  async getPersonalizedFeed(
    @Param('id') id: string,
    @CurrentUserId() userId: string, // JWTトークンからユーザーIDを取得
  ): Promise<GetPersonalizedFeedWithFiltersResponseDto> {
    this.logger.debug(`PersonalizedFeedsController.getPersonalizedFeed`, {
      id,
      userId,
    });

    try {
      // 指定されたIDのパーソナライズフィードをフィルター情報付きで取得
      const feed = await this.personalizedFeedsService.findByIdWithFilters(
        id,
        userId,
      );
      // DTOに変換して返却
      return GetPersonalizedFeedWithFiltersResponseDto.fromEntity(feed);
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
    type: CreatePersonalizedFeedWithFiltersResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'ユーザーが存在しない',
  })
  @ApiResponse({
    status: 400,
    description: 'リクエストパラメータが不正',
  })
  @UseGuards(SubscriptionGuard)
  async createPersonalizedFeed(
    @Body() dto: CreatePersonalizedFeedRequestDto,
    @CurrentUserId() userId: string, // JWTトークンからユーザーIDを取得
    @SubscriptionDecorator() subscription: SubscriptionInfo, // サブスクリプション情報
  ): Promise<CreatePersonalizedFeedWithFiltersResponseDto> {
    this.logger.debug(`PersonalizedFeedsController.createPersonalizedFeed`, {
      userId,
      name: dto.name,
      dataSource: dto.dataSource,
      filterConfig: dto.filterConfig ? 'provided' : 'not provided',
      deliveryConfig: dto.deliveryConfig ? 'provided' : 'not provided',
      deliveryFrequency: dto.deliveryFrequency,
      isActive: dto.isActive,
      hasFilterGroups: dto.filterGroups && dto.filterGroups.length > 0,
      filterGroupsCount: dto.filterGroups?.length || 0,
      tagFiltersCount: dto.filterGroups?.[0]?.tagFilters?.length || 0,
      authorFiltersCount: dto.filterGroups?.[0]?.authorFilters?.length || 0,
      dateRangeFiltersCount:
        dto.filterGroups?.[0]?.dateRangeFilters?.length || 0,
      dateRangeFilter:
        dto.filterGroups?.[0]?.dateRangeFilters?.[0]?.daysAgo || null,
      likesCountFiltersCount:
        dto.filterGroups?.[0]?.likesCountFilters?.length || 0,
      likesCountFilter:
        dto.filterGroups?.[0]?.likesCountFilters?.[0]?.minLikes || null,
    });

    try {
      // DTOからドメインパラメータに変換
      const createParams: CreatePersonalizedFeedParams = {
        name: dto.name,
        dataSource: dto.dataSource,
        filterConfig: dto.filterConfig || {},
        deliveryConfig: dto.deliveryConfig || {},
        deliveryFrequency: dto.deliveryFrequency,
        isActive: dto.isActive ?? true,
        filterGroups: dto.filterGroups?.map((group) => ({
          name: group.name,
          logicType: group.logicType || 'OR',
          tagFilters: group.tagFilters,
          authorFilters: group.authorFilters,
          dateRangeFilters: group.dateRangeFilters,
          likesCountFilters: group.likesCountFilters,
        })),
      };
      this.logger.debug(`サブスクリプション情報`, { subscription });

      // パーソナライズフィードを作成
      const feed = await this.personalizedFeedsService.create(
        userId,
        createParams,
        subscription,
      );

      // フィルター情報を含むDTOに変換して返却
      return CreatePersonalizedFeedWithFiltersResponseDto.fromEntity(feed);
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        // UserNotFoundErrorをNotFoundExceptionに変換
        this.logger.warn(`ユーザーが見つかりません`, {
          userId,
          error: error.message,
        });
        throw new NotFoundException(error.message);
      } else if (error instanceof PersonalizedFeedCreationLimitError) {
        this.logger.warn(`パーソナライズフィードの作成制限に達しています`, {
          userId,
          error: error.message,
        });
        throw new BadRequestException(error.message);
      }
      // その他のエラーはログ出力して再スロー
      this.logger.error(`パーソナライズフィードの作成に失敗しました`, error);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'パーソナライズフィードの作成に失敗しました',
        error.message,
      );
    }
  }

  /**
   * パーソナライズフィードを更新するAPI
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'パーソナライズフィード更新',
    description: '指定されたIDのパーソナライズフィードを更新します',
    operationId: 'updatePersonalizedFeed',
  })
  @ApiParam({
    name: 'id',
    description: 'パーソナライズフィードID',
    required: true,
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: '更新成功',
    type: UpdatePersonalizedFeedWithFiltersResponseDto,
  })
  @ApiResponse({
    status: 404,
    description:
      'パーソナライズフィードが存在しない、またはユーザーが存在しない',
  })
  @ApiResponse({
    status: 400,
    description: 'リクエストパラメータが不正',
  })
  @UseGuards(SubscriptionGuard)
  async updatePersonalizedFeed(
    @Param('id') id: string,
    @Body() dto: UpdatePersonalizedFeedRequestDto,
    @CurrentUserId() userId: string, // JWTトークンからユーザーIDを取得
    @SubscriptionDecorator() subscription: SubscriptionInfo, // サブスクリプション情報
  ): Promise<UpdatePersonalizedFeedWithFiltersResponseDto> {
    this.logger.debug(`PersonalizedFeedsController.updatePersonalizedFeed`, {
      id,
      userId,
      updates: {
        name: dto.name,
        dataSource: dto.dataSource,
        deliveryFrequency: dto.deliveryFrequency,
        hasFilterGroups: dto.filterGroups && dto.filterGroups.length > 0,
        filterGroupsCount: dto.filterGroups?.length || 0,
        tagFiltersCount: dto.filterGroups?.[0]?.tagFilters?.length || 0,
        authorFiltersCount: dto.filterGroups?.[0]?.authorFilters?.length || 0,
        dateRangeFiltersCount:
          dto.filterGroups?.[0]?.dateRangeFilters?.length || 0,
        dateRangeFilter:
          dto.filterGroups?.[0]?.dateRangeFilters?.[0]?.daysAgo || null,
        likesCountFiltersCount:
          dto.filterGroups?.[0]?.likesCountFilters?.length || 0,
        likesCountFilter:
          dto.filterGroups?.[0]?.likesCountFilters?.[0]?.minLikes || null,
      },
    });

    try {
      // DTOからドメインパラメータに変換
      const updateParams: UpdatePersonalizedFeedParams = {
        id: id,
        name: dto.name,
        dataSource: dto.dataSource,
        filterConfig: dto.filterConfig,
        deliveryConfig: dto.deliveryConfig,
        deliveryFrequency: dto.deliveryFrequency,
        isActive: dto.isActive,
        filterGroups: dto.filterGroups?.map((group) => ({
          name: group.name,
          logicType: group.logicType || 'OR',
          tagFilters: group.tagFilters,
          authorFilters: group.authorFilters,
          dateRangeFilters: group.dateRangeFilters,
          likesCountFilters: group.likesCountFilters,
        })),
      };

      // パーソナライズフィードを更新
      const feed = await this.personalizedFeedsService.update(
        userId,
        updateParams,
        subscription,
      );

      // フィルター情報を含むDTOに変換して返却
      return UpdatePersonalizedFeedWithFiltersResponseDto.fromEntity(feed);
    } catch (error) {
      // NotFoundExceptionはそのまま再スロー
      if (error instanceof NotFoundException) {
        throw error;
      }

      if (error instanceof UserNotFoundError) {
        // UserNotFoundErrorをNotFoundExceptionに変換
        this.logger.warn(`ユーザーが見つかりません`, {
          userId,
          error: error.message,
        });
        throw new NotFoundException(error.message);
      } else if (error instanceof PersonalizedFeedCreationLimitError) {
        this.logger.warn(`パーソナライズフィードの作成制限に達しています`, {
          userId,
          error: error.message,
        });
        throw new BadRequestException(error.message);
      }

      // その他のエラーはログ出力して再スロー
      this.logger.error(`パーソナライズフィードの更新に失敗しました`, error);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'パーソナライズフィードの更新に失敗しました',
        error.message,
      );
    }
  }

  /**
   * パーソナライズフィードを論理削除するAPI
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'パーソナライズフィード削除',
    description: '指定されたIDのパーソナライズフィードを論理削除します',
    operationId: 'deletePersonalizedFeed',
  })
  @ApiParam({
    name: 'id',
    description: 'パーソナライズフィードID',
    required: true,
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: '削除成功',
    type: DeletePersonalizedFeedResponseDto,
  })
  @ApiResponse({
    status: 404,
    description:
      'パーソナライズフィードが存在しない、またはユーザーが存在しない',
  })
  async deletePersonalizedFeed(
    @Param('id') id: string,
    @CurrentUserId() userId: string, // JWTトークンからユーザーIDを取得
  ): Promise<DeletePersonalizedFeedResponseDto> {
    this.logger.debug(`PersonalizedFeedsController.deletePersonalizedFeed`, {
      id,
      userId,
    });

    try {
      // パーソナライズフィードを論理削除
      const feed = await this.personalizedFeedsService.delete(id, userId);

      // DTOに変換して返却
      return DeletePersonalizedFeedResponseDto.fromEntity(feed);
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
      this.logger.error(`パーソナライズフィードの削除に失敗しました`, error);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'パーソナライズフィードの削除に失敗しました',
        error.message,
      );
    }
  }
}
