import { CurrentUserId } from '@/auth/decorators/current-user-id.decorator';
import { ClerkJwtGuard } from '@/auth/guards/clerk-jwt.guard';
import { DashboardService } from '@/domains/dashboard/dashboard.service';
import {
  Controller,
  Get,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  GetDashboardPersonalizedProgramsRequestDto,
  GetDashboardPersonalizedProgramsResponseDto,
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
      'ダッシュボード表示用の統計情報（アクティブフィード数、月間配信数、総番組時間）を取得します',
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
        monthlyEpisodesCount: stats.monthlyEpisodesCount,
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
      });

      return programs;
    } catch (error) {
      const errorMessage = 'パーソナルプログラム一覧の取得に失敗しました';
      this.logger.error(errorMessage, { userId, error }, error.stack);
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
}
