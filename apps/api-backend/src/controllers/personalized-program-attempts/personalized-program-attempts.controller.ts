import { CurrentUserId } from '@/auth/decorators/current-user-id.decorator';
import { ClerkJwtGuard } from '@/auth/guards/clerk-jwt.guard';
import { PersonalizedProgramAttemptsService } from '@/domains/personalized-program-attempts/personalized-program-attempts.service';
import {
  PersonalizedFeedNotFoundError,
  PersonalizedProgramAttemptRetrievalError,
} from '@/types/errors';
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
import {
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  GetProgramAttemptsCountResponseDto,
  GetProgramAttemptsRequestDto,
  GetProgramAttemptsResponseDto,
  GetProgramAttemptsStatisticsResponseDto,
  PersonalizedProgramAttemptDto,
} from './dto';

/**
 * フィード別番組生成履歴コントローラー
 * フィード別の番組生成試行履歴の取得・統計情報の提供などのエンドポイントを提供
 */
@ApiTags('personalized-program-attempts')
@Controller('personalized-program-attempts')
@UseGuards(ClerkJwtGuard)
@ApiBearerAuth()
export class PersonalizedProgramAttemptsController {
  private readonly logger = new Logger(
    PersonalizedProgramAttemptsController.name,
  );

  constructor(
    private readonly personalizedProgramAttemptsService: PersonalizedProgramAttemptsService,
  ) {}

  /**
   * フィード別番組生成履歴一覧を取得する
   */
  @Get('feeds/:feedId')
  @ApiOperation({
    summary: 'フィード別番組生成履歴一覧取得',
    description:
      '指定されたフィードの番組生成試行履歴一覧をページネーション付きで取得します',
    operationId: 'getProgramAttempts',
  })
  @ApiParam({
    name: 'feedId',
    description: 'フィードID',
    type: String,
    example: 'feed_1234567890',
  })
  @ApiOkResponse({
    description: '番組生成履歴一覧の取得に成功',
    type: GetProgramAttemptsResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'フィードが見つからない、またはアクセス権限がない',
  })
  @ApiUnauthorizedResponse({
    description: '認証が必要',
  })
  @ApiInternalServerErrorResponse({
    description: 'サーバー内部エラー',
  })
  async getProgramAttempts(
    @Param('feedId') feedId: string,
    @Query() query: GetProgramAttemptsRequestDto,
    @CurrentUserId() userId: string,
  ): Promise<GetProgramAttemptsResponseDto> {
    this.logger.debug(
      'PersonalizedProgramAttemptsController.getProgramAttempts called',
      {
        feedId,
        userId,
        page: query.page,
        limit: query.limit,
      },
    );

    try {
      const result =
        await this.personalizedProgramAttemptsService.getProgramAttempts({
          feedId,
          userId,
          page: query.page || 1,
          limit: query.limit || 20,
        });

      const response: GetProgramAttemptsResponseDto = {
        attempts: result.attempts.map((attempt) =>
          PersonalizedProgramAttemptDto.fromEntity(attempt),
        ),
        totalCount: result.totalCount,
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        hasNextPage: result.hasNextPage,
        hasPreviousPage: result.hasPreviousPage,
      };

      this.logger.log('フィード別番組生成履歴一覧を取得しました', {
        feedId,
        userId,
        totalCount: result.totalCount,
        currentPage: result.currentPage,
      });

      return response;
    } catch (error) {
      if (error instanceof PersonalizedFeedNotFoundError) {
        this.logger.warn(
          'フィードが見つからない、またはアクセス権限がありません',
          {
            feedId,
            userId,
            error: error.message,
          },
        );
        throw new NotFoundException(
          'フィードが見つからない、またはアクセス権限がありません',
        );
      }

      if (error instanceof PersonalizedProgramAttemptRetrievalError) {
        this.logger.error('番組生成履歴の取得に失敗しました', {
          feedId,
          userId,
          error: error.message,
          stack: error.stack,
        });
        throw new InternalServerErrorException(
          '番組生成履歴の取得に失敗しました',
        );
      }

      this.logger.error('予期しないエラーが発生しました', {
        feedId,
        userId,
        error: error.message,
        stack: error.stack,
      });
      throw new InternalServerErrorException('予期しないエラーが発生しました');
    }
  }

  /**
   * フィード別番組生成履歴統計情報を取得する
   */
  @Get('feeds/:feedId/statistics')
  @ApiOperation({
    summary: 'フィード別番組生成履歴統計情報取得',
    description:
      '指定されたフィードの番組生成試行履歴の統計情報（成功率、各ステータス別件数など）を取得します',
    operationId: 'getProgramAttemptsStatistics',
  })
  @ApiParam({
    name: 'feedId',
    description: 'フィードID',
    type: String,
    example: 'feed_1234567890',
  })
  @ApiOkResponse({
    description: '番組生成履歴統計情報の取得に成功',
    type: GetProgramAttemptsStatisticsResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'フィードが見つからない、またはアクセス権限がない',
  })
  @ApiUnauthorizedResponse({
    description: '認証が必要',
  })
  @ApiInternalServerErrorResponse({
    description: 'サーバー内部エラー',
  })
  async getProgramAttemptsStatistics(
    @Param('feedId') feedId: string,
    @CurrentUserId() userId: string,
  ): Promise<GetProgramAttemptsStatisticsResponseDto> {
    this.logger.debug(
      'PersonalizedProgramAttemptsController.getProgramAttemptsStatistics called',
      {
        feedId,
        userId,
      },
    );

    try {
      const statistics =
        await this.personalizedProgramAttemptsService.getProgramAttemptsStatistics(
          feedId,
          userId,
        );

      const response: GetProgramAttemptsStatisticsResponseDto = {
        totalAttempts: statistics.totalAttempts,
        successCount: statistics.successCount,
        skippedCount: statistics.skippedCount,
        failedCount: statistics.failedCount,
        successRate: statistics.successRate,
        lastAttemptDate: statistics.lastAttemptDate?.toISOString(),
        lastSuccessDate: statistics.lastSuccessDate?.toISOString(),
      };

      this.logger.log('フィード別番組生成履歴統計情報を取得しました', {
        feedId,
        userId,
        totalAttempts: statistics.totalAttempts,
        successRate: statistics.successRate,
      });

      return response;
    } catch (error) {
      if (error instanceof PersonalizedFeedNotFoundError) {
        this.logger.warn(
          'フィードが見つからない、またはアクセス権限がありません',
          {
            feedId,
            userId,
            error: error.message,
          },
        );
        throw new NotFoundException(
          'フィードが見つからない、またはアクセス権限がありません',
        );
      }

      if (error instanceof PersonalizedProgramAttemptRetrievalError) {
        this.logger.error('番組生成履歴統計情報の取得に失敗しました', {
          feedId,
          userId,
          error: error.message,
          stack: error.stack,
        });
        throw new InternalServerErrorException(
          '番組生成履歴統計情報の取得に失敗しました',
        );
      }

      this.logger.error('予期しないエラーが発生しました', {
        feedId,
        userId,
        error: error.message,
        stack: error.stack,
      });
      throw new InternalServerErrorException('予期しないエラーが発生しました');
    }
  }

  /**
   * フィード別番組生成履歴件数を取得する
   */
  @Get('feeds/:feedId/count')
  @ApiOperation({
    summary: 'フィード別番組生成履歴件数取得',
    description: '指定されたフィードの番組生成試行履歴の総件数を取得します',
    operationId: 'getProgramAttemptsCount',
  })
  @ApiParam({
    name: 'feedId',
    description: 'フィードID',
    type: String,
    example: 'feed_1234567890',
  })
  @ApiOkResponse({
    description: '番組生成履歴件数の取得に成功',
    type: GetProgramAttemptsCountResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'フィードが見つからない、またはアクセス権限がない',
  })
  @ApiUnauthorizedResponse({
    description: '認証が必要',
  })
  @ApiInternalServerErrorResponse({
    description: 'サーバー内部エラー',
  })
  async getProgramAttemptsCount(
    @Param('feedId') feedId: string,
    @CurrentUserId() userId: string,
  ): Promise<GetProgramAttemptsCountResponseDto> {
    this.logger.debug(
      'PersonalizedProgramAttemptsController.getProgramAttemptsCount called',
      {
        feedId,
        userId,
      },
    );

    try {
      const count =
        await this.personalizedProgramAttemptsService.getProgramAttemptsCount(
          feedId,
          userId,
        );

      const response: GetProgramAttemptsCountResponseDto = {
        count,
      };

      this.logger.log('フィード別番組生成履歴件数を取得しました', {
        feedId,
        userId,
        count,
      });

      return response;
    } catch (error) {
      if (error instanceof PersonalizedFeedNotFoundError) {
        this.logger.warn(
          'フィードが見つからない、またはアクセス権限がありません',
          {
            feedId,
            userId,
            error: error.message,
          },
        );
        throw new NotFoundException(
          'フィードが見つからない、またはアクセス権限がありません',
        );
      }

      if (error instanceof PersonalizedProgramAttemptRetrievalError) {
        this.logger.error('番組生成履歴件数の取得に失敗しました', {
          feedId,
          userId,
          error: error.message,
          stack: error.stack,
        });
        throw new InternalServerErrorException(
          '番組生成履歴件数の取得に失敗しました',
        );
      }

      this.logger.error('予期しないエラーが発生しました', {
        feedId,
        userId,
        error: error.message,
        stack: error.stack,
      });
      throw new InternalServerErrorException('予期しないエラーが発生しました');
    }
  }
}
