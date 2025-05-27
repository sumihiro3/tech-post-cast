import { PersonalizedProgramAttemptsService } from '@/domains/personalized-program-attempts/personalized-program-attempts.service';
import { PersonalizedProgramAttemptFactory } from '@/test/factories';
import {
  restoreLogOutput,
  suppressLogOutput,
} from '@/test/helpers/logger.helper';
import {
  PersonalizedFeedNotFoundError,
  PersonalizedProgramAttemptRetrievalError,
} from '@/types/errors';
import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ClerkJwtGuard } from '../../auth/guards/clerk-jwt.guard';
import { PersonalizedProgramAttemptsController } from './personalized-program-attempts.controller';

describe('PersonalizedProgramAttemptsController', () => {
  let controller: PersonalizedProgramAttemptsController;
  let mockService: jest.Mocked<PersonalizedProgramAttemptsService>;
  let logSpies: jest.SpyInstance[];

  const mockUserId = 'user_1234567890';
  const mockFeedId = 'feed_1234567890';

  const mockAttempts =
    PersonalizedProgramAttemptFactory.createMixedStatusAttempts({
      userId: mockUserId,
      feedId: mockFeedId,
    });

  const mockProgramAttemptsResult = {
    attempts: mockAttempts,
    totalCount: 3,
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  const mockStatistics = {
    totalAttempts: 3,
    successCount: 1,
    skippedCount: 1,
    failedCount: 1,
    successRate: 33.33,
    lastAttemptDate: new Date('2024-01-03'),
    lastSuccessDate: new Date('2024-01-03'),
  };

  beforeEach(async () => {
    logSpies = suppressLogOutput();

    mockService = {
      getProgramAttempts: jest.fn(),
      getProgramAttemptsStatistics: jest.fn(),
      getProgramAttemptsCount: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PersonalizedProgramAttemptsController],
      providers: [
        {
          provide: PersonalizedProgramAttemptsService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(ClerkJwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<PersonalizedProgramAttemptsController>(
      PersonalizedProgramAttemptsController,
    );
  });

  afterEach(() => {
    restoreLogOutput(logSpies);
    jest.clearAllMocks();
  });

  describe('getProgramAttempts', () => {
    const query = { page: 1, limit: 20 };

    it('フィード別番組生成履歴一覧を正常に取得できること', async () => {
      mockService.getProgramAttempts.mockResolvedValue(
        mockProgramAttemptsResult,
      );

      const result = await controller.getProgramAttempts(
        mockFeedId,
        query,
        mockUserId,
      );

      expect(result.attempts).toHaveLength(3);
      expect(result.totalCount).toBe(3);
      expect(result.currentPage).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(result.hasNextPage).toBe(false);
      expect(result.hasPreviousPage).toBe(false);

      expect(mockService.getProgramAttempts).toHaveBeenCalledWith({
        feedId: mockFeedId,
        userId: mockUserId,
        page: 1,
        limit: 20,
      });
    });

    it('フィードが見つからない場合、NotFoundExceptionがスローされること', async () => {
      mockService.getProgramAttempts.mockRejectedValue(
        new PersonalizedFeedNotFoundError('フィードが見つかりません'),
      );

      await expect(
        controller.getProgramAttempts(mockFeedId, query, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('番組生成履歴の取得に失敗した場合、InternalServerErrorExceptionがスローされること', async () => {
      mockService.getProgramAttempts.mockRejectedValue(
        new PersonalizedProgramAttemptRetrievalError('取得に失敗しました'),
      );

      await expect(
        controller.getProgramAttempts(mockFeedId, query, mockUserId),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('予期しないエラーが発生した場合、InternalServerErrorExceptionがスローされること', async () => {
      mockService.getProgramAttempts.mockRejectedValue(
        new Error('予期しないエラー'),
      );

      await expect(
        controller.getProgramAttempts(mockFeedId, query, mockUserId),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getProgramAttemptsStatistics', () => {
    it('フィード別番組生成履歴統計情報を正常に取得できること', async () => {
      mockService.getProgramAttemptsStatistics.mockResolvedValue(
        mockStatistics,
      );

      const result = await controller.getProgramAttemptsStatistics(
        mockFeedId,
        mockUserId,
      );

      expect(result.totalAttempts).toBe(3);
      expect(result.successCount).toBe(1);
      expect(result.skippedCount).toBe(1);
      expect(result.failedCount).toBe(1);
      expect(result.successRate).toBe(33.33);
      expect(result.lastAttemptDate).toBe('2024-01-03T00:00:00.000Z');
      expect(result.lastSuccessDate).toBe('2024-01-03T00:00:00.000Z');

      expect(mockService.getProgramAttemptsStatistics).toHaveBeenCalledWith(
        mockFeedId,
        mockUserId,
      );
    });

    it('フィードが見つからない場合、NotFoundExceptionがスローされること', async () => {
      mockService.getProgramAttemptsStatistics.mockRejectedValue(
        new PersonalizedFeedNotFoundError('フィードが見つかりません'),
      );

      await expect(
        controller.getProgramAttemptsStatistics(mockFeedId, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('統計情報の取得に失敗した場合、InternalServerErrorExceptionがスローされること', async () => {
      mockService.getProgramAttemptsStatistics.mockRejectedValue(
        new PersonalizedProgramAttemptRetrievalError('取得に失敗しました'),
      );

      await expect(
        controller.getProgramAttemptsStatistics(mockFeedId, mockUserId),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getProgramAttemptsCount', () => {
    it('フィード別番組生成履歴件数を正常に取得できること', async () => {
      mockService.getProgramAttemptsCount.mockResolvedValue(5);

      const result = await controller.getProgramAttemptsCount(
        mockFeedId,
        mockUserId,
      );

      expect(result.count).toBe(5);

      expect(mockService.getProgramAttemptsCount).toHaveBeenCalledWith(
        mockFeedId,
        mockUserId,
      );
    });

    it('フィードが見つからない場合、NotFoundExceptionがスローされること', async () => {
      mockService.getProgramAttemptsCount.mockRejectedValue(
        new PersonalizedFeedNotFoundError('フィードが見つかりません'),
      );

      await expect(
        controller.getProgramAttemptsCount(mockFeedId, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('件数の取得に失敗した場合、InternalServerErrorExceptionがスローされること', async () => {
      mockService.getProgramAttemptsCount.mockRejectedValue(
        new PersonalizedProgramAttemptRetrievalError('取得に失敗しました'),
      );

      await expect(
        controller.getProgramAttemptsCount(mockFeedId, mockUserId),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
