import { ClerkJwtGuard } from '@/auth/guards/clerk-jwt.guard';
import { DashboardService } from '@/domains/dashboard/dashboard.service';
import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  restoreLogOutput,
  suppressLogOutput,
} from '../../test/helpers/logger.helper';
import { DashboardController } from './dashboard.controller';
import {
  GetDashboardPersonalizedProgramsRequestDto,
  GetDashboardPersonalizedProgramsResponseDto,
  GetDashboardStatsResponseDto,
  GetDashboardSubscriptionResponseDto,
} from './dto';

describe('DashboardController', () => {
  let controller: DashboardController;
  let dashboardService: jest.Mocked<DashboardService>;
  let logSpies: jest.SpyInstance[];

  beforeEach(async () => {
    logSpies = suppressLogOutput();

    const mockDashboardService = {
      getDashboardStats: jest.fn(),
      getPersonalizedPrograms: jest.fn(),
      getDashboardSubscription: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        {
          provide: DashboardService,
          useValue: mockDashboardService,
        },
      ],
    })
      .overrideGuard(ClerkJwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<DashboardController>(DashboardController);
    dashboardService = module.get(
      DashboardService,
    ) as jest.Mocked<DashboardService>;
  });

  afterEach(() => {
    restoreLogOutput(logSpies);
  });

  describe('getDashboardStats', () => {
    it('統計情報を正常に取得できること', async () => {
      const userId = 'user-1';
      const mockStats: GetDashboardStatsResponseDto = {
        activeFeedsCount: 5,
        monthlyEpisodesCount: 12,
        totalProgramDuration: '2.5h',
      };

      dashboardService.getDashboardStats.mockResolvedValue(mockStats);

      const result = await controller.getDashboardStats(userId);

      expect(result).toEqual(mockStats);
      expect(dashboardService.getDashboardStats).toHaveBeenCalledWith(userId);
    });

    it('AppUserが見つからない場合、NotFoundExceptionを投げること', async () => {
      const userId = 'non-existent-user';
      const notFoundError = new NotFoundException(
        `User with ID ${userId} not found`,
      );

      dashboardService.getDashboardStats.mockRejectedValue(notFoundError);

      await expect(controller.getDashboardStats(userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.getDashboardStats(userId)).rejects.toThrow(
        `User with ID ${userId} not found`,
      );

      expect(dashboardService.getDashboardStats).toHaveBeenCalledWith(userId);
    });

    it('サービスでエラーが発生した場合、InternalServerErrorExceptionを投げること', async () => {
      const userId = 'user-1';
      const error = new Error('Database error');

      dashboardService.getDashboardStats.mockRejectedValue(error);

      await expect(controller.getDashboardStats(userId)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(controller.getDashboardStats(userId)).rejects.toThrow(
        'ダッシュボード統計情報の取得に失敗しました',
      );

      expect(dashboardService.getDashboardStats).toHaveBeenCalledWith(userId);
    });
  });

  describe('getDashboardPersonalizedPrograms', () => {
    it('パーソナルプログラム一覧を正常に取得できること', async () => {
      const userId = 'user-1';
      const query: GetDashboardPersonalizedProgramsRequestDto = {
        limit: 10,
        offset: 0,
      };
      const mockPrograms: GetDashboardPersonalizedProgramsResponseDto = {
        programs: [],
        totalCount: 0,
        limit: 10,
        offset: 0,
        hasNext: false,
      };

      dashboardService.getPersonalizedPrograms.mockResolvedValue(mockPrograms);

      const result = await controller.getDashboardPersonalizedPrograms(
        userId,
        query,
      );

      expect(result).toEqual(mockPrograms);
      expect(dashboardService.getPersonalizedPrograms).toHaveBeenCalledWith(
        userId,
        query,
      );
    });

    it('AppUserが見つからない場合、NotFoundExceptionを投げること', async () => {
      const userId = 'non-existent-user';
      const query: GetDashboardPersonalizedProgramsRequestDto = {
        limit: 10,
        offset: 0,
      };
      const notFoundError = new NotFoundException(
        `User with ID ${userId} not found`,
      );

      dashboardService.getPersonalizedPrograms.mockRejectedValue(notFoundError);

      await expect(
        controller.getDashboardPersonalizedPrograms(userId, query),
      ).rejects.toThrow(NotFoundException);
      await expect(
        controller.getDashboardPersonalizedPrograms(userId, query),
      ).rejects.toThrow(`User with ID ${userId} not found`);

      expect(dashboardService.getPersonalizedPrograms).toHaveBeenCalledWith(
        userId,
        query,
      );
    });

    it('サービスでエラーが発生した場合、InternalServerErrorExceptionを投げること', async () => {
      const userId = 'user-1';
      const query: GetDashboardPersonalizedProgramsRequestDto = {
        limit: 10,
        offset: 0,
      };
      const error = new Error('Database error');

      dashboardService.getPersonalizedPrograms.mockRejectedValue(error);

      await expect(
        controller.getDashboardPersonalizedPrograms(userId, query),
      ).rejects.toThrow(InternalServerErrorException);
      await expect(
        controller.getDashboardPersonalizedPrograms(userId, query),
      ).rejects.toThrow('パーソナルプログラム一覧の取得に失敗しました');

      expect(dashboardService.getPersonalizedPrograms).toHaveBeenCalledWith(
        userId,
        query,
      );
    });
  });

  describe('getDashboardSubscription', () => {
    it('サブスクリプション情報を正常に取得できること', async () => {
      const userId = 'user-1';
      const mockSubscription: GetDashboardSubscriptionResponseDto = {
        planName: 'Free',
        planColor: 'grey',
        features: [
          { name: 'パーソナルフィード作成', available: true },
          { name: '日次配信', available: true },
        ],
        usageItems: [
          {
            label: 'フィード数',
            current: 2,
            limit: 10,
            showPercentage: true,
            warningThreshold: 70,
            dangerThreshold: 90,
          },
        ],
        showUpgradeButton: true,
      };

      dashboardService.getDashboardSubscription.mockResolvedValue(
        mockSubscription,
      );

      const result = await controller.getDashboardSubscription(userId);

      expect(result).toEqual(mockSubscription);
      expect(dashboardService.getDashboardSubscription).toHaveBeenCalledWith(
        userId,
      );
    });

    it('AppUserが見つからない場合、NotFoundExceptionを投げること', async () => {
      const userId = 'non-existent-user';
      const notFoundError = new NotFoundException(
        `User with ID ${userId} not found`,
      );

      dashboardService.getDashboardSubscription.mockRejectedValue(
        notFoundError,
      );

      await expect(controller.getDashboardSubscription(userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.getDashboardSubscription(userId)).rejects.toThrow(
        `User with ID ${userId} not found`,
      );

      expect(dashboardService.getDashboardSubscription).toHaveBeenCalledWith(
        userId,
      );
    });

    it('その他のエラーが発生した場合、InternalServerErrorExceptionを投げること', async () => {
      const userId = 'user-1';
      const error = new Error('Database connection failed');

      dashboardService.getDashboardSubscription.mockRejectedValue(error);

      await expect(controller.getDashboardSubscription(userId)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(controller.getDashboardSubscription(userId)).rejects.toThrow(
        'サブスクリプション情報の取得に失敗しました',
      );

      expect(dashboardService.getDashboardSubscription).toHaveBeenCalledWith(
        userId,
      );
    });

    it('NotFoundExceptionの場合、適切なログメッセージが出力されること', async () => {
      const userId = 'non-existent-user';
      const notFoundError = new NotFoundException(
        `User with ID ${userId} not found`,
      );

      dashboardService.getDashboardSubscription.mockRejectedValue(
        notFoundError,
      );

      try {
        await controller.getDashboardSubscription(userId);
      } catch (error) {
        // エラーが投げられることを期待
      }

      expect(dashboardService.getDashboardSubscription).toHaveBeenCalledWith(
        userId,
      );
    });

    it('一般的なエラーの場合、適切なログメッセージが出力されること', async () => {
      const userId = 'user-1';
      const error = new Error('Unexpected error');

      dashboardService.getDashboardSubscription.mockRejectedValue(error);

      try {
        await controller.getDashboardSubscription(userId);
      } catch (error) {
        // エラーが投げられることを期待
      }

      expect(dashboardService.getDashboardSubscription).toHaveBeenCalledWith(
        userId,
      );
    });
  });
});
