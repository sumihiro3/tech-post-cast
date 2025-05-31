import { CurrentUserId } from '@/auth/decorators/current-user-id.decorator';
import { ClerkJwtGuard } from '@/auth/guards/clerk-jwt.guard';
import { DashboardService } from '@/domains/dashboard/dashboard.service';
import {
  Controller,
  Get,
  InternalServerErrorException,
  Logger,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  GetDashboardPersonalizedFeedsSummaryResponseDto,
  GetDashboardPersonalizedProgramsRequestDto,
  GetDashboardPersonalizedProgramsResponseDto,
  GetDashboardStatsResponseDto,
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
      const errorMessage = 'ダッシュボード統計情報の取得に失敗しました';
      this.logger.error(errorMessage, { userId, error }, error.stack);
      throw new InternalServerErrorException(errorMessage);
    }
  }

  @Get('personalized-feeds/summary')
  @ApiOperation({
    operationId: 'getDashboardPersonalizedFeedsSummary',
    summary: 'ダッシュボード用パーソナルフィード概要取得',
    description: 'ダッシュボード表示用のパーソナルフィード概要情報を取得します',
  })
  @ApiResponse({
    status: 200,
    description: 'パーソナルフィード概要情報',
    type: GetDashboardPersonalizedFeedsSummaryResponseDto,
  })
  async getDashboardPersonalizedFeedsSummary(
    @CurrentUserId() userId: string,
  ): Promise<GetDashboardPersonalizedFeedsSummaryResponseDto> {
    this.logger.debug(
      'DashboardController.getDashboardPersonalizedFeedsSummary called',
      { userId },
    );

    try {
      const summary =
        await this.dashboardService.getPersonalizedFeedsSummary(userId);

      this.logger.log('パーソナルフィード概要情報を取得しました', {
        userId,
        activeFeedsCount: summary.activeFeedsCount,
        recentFeedsCount: summary.recentFeeds.length,
      });

      return summary;
    } catch (error) {
      const errorMessage = 'パーソナルフィード概要情報の取得に失敗しました';
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
}
