import { CurrentUserId } from '@/auth/decorators/current-user-id.decorator';
import { ClerkJwtGuard } from '@/auth/guards/clerk-jwt.guard';
import { DashboardService } from '@/domains/dashboard/dashboard.service';
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
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  GetDashboardPersonalizedProgramDetailResponseDto,
  GetDashboardPersonalizedProgramsRequestDto,
  GetDashboardPersonalizedProgramsResponseDto,
  GetDashboardProgramGenerationHistoryRequestDto,
  GetDashboardProgramGenerationHistoryResponseDto,
  GetDashboardStatsResponseDto,
  GetDashboardSubscriptionResponseDto,
} from './dto';

@Controller('dashboard')
@ApiTags('Dashboard')
@UseGuards(ClerkJwtGuard)
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);

  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({
    operationId: 'getDashboardStats',
    summary: 'ダッシュボード統計情報取得',
    description:
      'ダッシュボード表示用の統計情報（アクティブフィード数、総配信数、総番組時間）を取得します',
  })
  @ApiResponse({
    status: 200,
    description: 'ダッシュボード統計情報',
    type: GetDashboardStatsResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'ユーザーが見つかりません',
  })
  @ApiResponse({
    status: 500,
    description: 'サーバーエラー',
  })
  async getDashboardStats(
    @CurrentUserId() userId: string,
  ): Promise<GetDashboardStatsResponseDto> {
    this.logger.debug('DashboardController.getDashboardStats called', {
      userId,
    });

    try {
      const stats = await this.dashboardService.getDashboardStats(userId);

      this.logger.log('ダッシュボード統計情報を取得しました', {
        userId,
        activeFeedsCount: stats.activeFeedsCount,
        totalEpisodesCount: stats.totalEpisodesCount,
        totalProgramDuration: stats.totalProgramDuration,
      });

      return stats;
    } catch (error) {
      if (error instanceof NotFoundException) {
        this.logger.warn(`AppUser [${userId}] が見つかりません`, { userId });
        throw error;
      }

      const errorMessage = 'ダッシュボード統計情報の取得に失敗しました';
      this.logger.error(errorMessage, { userId, error }, error.stack);
      throw new InternalServerErrorException(errorMessage);
    }
  }

  @Get('personalized-programs')
  @ApiOperation({
    operationId: 'getDashboardPersonalizedPrograms',
    summary: 'ダッシュボード用パーソナルプログラム一覧取得',
    description:
      'ダッシュボードトップ画面表示用の最新パーソナルプログラム一覧を取得します',
  })
  @ApiResponse({
    status: 200,
    description: 'パーソナルプログラム一覧',
    type: GetDashboardPersonalizedProgramsResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'ユーザーが見つかりません',
  })
  @ApiResponse({
    status: 500,
    description: 'サーバーエラー',
  })
  async getDashboardPersonalizedPrograms(
    @CurrentUserId() userId: string,
    @Query() query: GetDashboardPersonalizedProgramsRequestDto,
  ): Promise<GetDashboardPersonalizedProgramsResponseDto> {
    this.logger.debug(
      'DashboardController.getDashboardPersonalizedPrograms called',
      { userId, query },
    );

    try {
      const programs = await this.dashboardService.getPersonalizedPrograms(
        userId,
        query,
      );

      this.logger.log('パーソナルプログラム一覧を取得しました', {
        userId,
        programsCount: programs.programs.length,
        totalCount: programs.totalCount,
        limit: programs.limit,
        offset: programs.offset,
        hasNext: programs.hasNext,
      });

      return programs;
    } catch (error) {
      if (error instanceof NotFoundException) {
        this.logger.warn(`AppUser [${userId}] が見つかりません`, { userId });
        throw error;
      }

      const errorMessage = 'パーソナルプログラム一覧の取得に失敗しました';
      this.logger.error(errorMessage, { userId, query, error }, error.stack);
      throw new InternalServerErrorException(errorMessage);
    }
  }

  /**
   * ダッシュボードサブスクリプション情報を取得する
   */
  @Get('subscription')
  @ApiOperation({
    operationId: 'getDashboardSubscription',
    summary: 'ダッシュボードサブスクリプション情報取得',
    description:
      'ユーザーのサブスクリプション情報、使用量、機能一覧を取得します',
  })
  @ApiResponse({
    status: 200,
    description: 'サブスクリプション情報の取得に成功',
    type: GetDashboardSubscriptionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'ユーザーが見つかりません',
  })
  @ApiResponse({
    status: 500,
    description: 'サーバーエラー',
  })
  async getDashboardSubscription(
    @CurrentUserId() userId: string,
  ): Promise<GetDashboardSubscriptionResponseDto> {
    this.logger.log('getDashboardSubscription called', { userId });

    try {
      const result =
        await this.dashboardService.getDashboardSubscription(userId);
      this.logger.log('getDashboardSubscription completed', {
        userId,
        planName: result.planName,
      });
      return result;
    } catch (error) {
      if (error instanceof NotFoundException) {
        this.logger.warn(`AppUser [${userId}] が見つかりません`, { userId });
        throw error;
      }

      this.logger.error('getDashboardSubscription failed', {
        userId,
        error: error.message,
        stack: error.stack,
      });
      throw new InternalServerErrorException(
        'サブスクリプション情報の取得に失敗しました',
      );
    }
  }

  /**
   * パーソナルプログラムの詳細情報を取得する
   */
  @Get('personalized-programs/:id')
  @UseGuards(ClerkJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'パーソナルプログラムの詳細情報を取得',
    description:
      '指定されたIDのパーソナルプログラムの詳細情報（チャプター、紹介記事一覧、番組台本等）を取得します。',
  })
  @ApiParam({
    name: 'id',
    description: 'パーソナルプログラムID',
    example: 'program-123',
  })
  @ApiResponse({
    status: 200,
    description: 'パーソナルプログラムの詳細情報',
    type: GetDashboardPersonalizedProgramDetailResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'プログラムが見つからない',
  })
  async getPersonalizedProgramDetail(
    @CurrentUserId() userId: string,
    @Param('id') programId: string,
  ): Promise<GetDashboardPersonalizedProgramDetailResponseDto> {
    this.logger.debug(
      'DashboardController.getPersonalizedProgramDetail called',
      {
        userId,
        programId,
      },
    );

    return this.dashboardService.getPersonalizedProgramDetail(
      userId,
      programId,
    );
  }

  /**
   * 番組生成履歴を取得する
   */
  @Get('program-generation-history')
  @ApiOperation({
    operationId: 'getDashboardProgramGenerationHistory',
    summary: 'ダッシュボード用番組生成履歴取得',
    description:
      'ダッシュボード表示用の番組生成履歴一覧を取得します。フィードIDでフィルタリング可能です。',
  })
  @ApiResponse({
    status: 200,
    description: '番組生成履歴一覧',
    type: GetDashboardProgramGenerationHistoryResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'ユーザーが見つかりません',
  })
  @ApiResponse({
    status: 500,
    description: 'サーバーエラー',
  })
  async getDashboardProgramGenerationHistory(
    @CurrentUserId() userId: string,
    @Query() query: GetDashboardProgramGenerationHistoryRequestDto,
  ): Promise<GetDashboardProgramGenerationHistoryResponseDto> {
    this.logger.debug(
      'DashboardController.getDashboardProgramGenerationHistory called',
      { userId, query },
    );

    try {
      const history = await this.dashboardService.getProgramGenerationHistory(
        userId,
        query,
      );

      this.logger.log('番組生成履歴を取得しました', {
        userId,
        feedId: query.feedId,
        historyCount: history.history.length,
        totalCount: history.totalCount,
        limit: history.limit,
        offset: history.offset,
        hasNext: history.hasNext,
      });

      return history;
    } catch (error) {
      if (error instanceof NotFoundException) {
        this.logger.warn(`AppUser [${userId}] が見つかりません`, { userId });
        throw error;
      }

      const errorMessage = '番組生成履歴の取得に失敗しました';
      this.logger.error(errorMessage, { userId, query, error }, error.stack);
      throw new InternalServerErrorException(errorMessage);
    }
  }
}
