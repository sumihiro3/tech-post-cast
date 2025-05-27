import { Test, TestingModule } from '@nestjs/testing';
import { DeliveryFrequency } from '@prisma/client';
import { PersonalizedProgramAttemptFactory } from '../../test/factories/personalized-program-attempt.factory';
import {
  restoreLogOutput,
  suppressLogOutput,
} from '../../test/helpers/logger.helper';
import { PersonalizedFeedNotFoundError } from '../../types/errors';
import { IPersonalizedFeedsRepository } from '../personalized-feeds/personalized-feeds.repository.interface';
import { IPersonalizedProgramAttemptsRepository } from './personalized-program-attempts.repository.interface';
import { PersonalizedProgramAttemptsService } from './personalized-program-attempts.service';

describe('PersonalizedProgramAttemptsService', () => {
  let service: PersonalizedProgramAttemptsService;
  let attemptsRepository: jest.Mocked<IPersonalizedProgramAttemptsRepository>;
  let feedsRepository: jest.Mocked<IPersonalizedFeedsRepository>;
  let logSpies: jest.SpyInstance[];

  const mockFeed = {
    id: 'feed-1',
    userId: 'user-1',
    name: 'テストフィード',
    dataSource: 'test-source',
    filterConfig: {},
    deliveryConfig: {},
    deliveryFrequency: 'DAILY' as DeliveryFrequency,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockAttempts =
    PersonalizedProgramAttemptFactory.createMixedStatusAttempts({
      userId: 'user-1',
      feedId: 'feed-1',
    });

  beforeEach(async () => {
    logSpies = suppressLogOutput();

    attemptsRepository = {
      findByFeedIdWithPagination: jest.fn(),
      countByFeedId: jest.fn(),
      findByUserIdWithPagination: jest.fn(),
      findById: jest.fn(),
    };

    feedsRepository = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<IPersonalizedFeedsRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PersonalizedProgramAttemptsService,
        {
          provide: 'PersonalizedProgramAttemptsRepository',
          useValue: attemptsRepository,
        },
        {
          provide: 'PersonalizedFeedsRepository',
          useValue: feedsRepository,
        },
      ],
    }).compile();

    service = module.get<PersonalizedProgramAttemptsService>(
      PersonalizedProgramAttemptsService,
    );
  });

  afterEach(() => {
    restoreLogOutput(logSpies);
    jest.clearAllMocks();
  });

  describe('getProgramAttempts', () => {
    const params = {
      feedId: 'feed-1',
      userId: 'user-1',
      page: 1,
      limit: 20,
    };

    it('フィード別番組生成試行履歴を正常に取得できること', async () => {
      feedsRepository.findById.mockResolvedValue(mockFeed);
      attemptsRepository.findByFeedIdWithPagination.mockResolvedValue({
        attempts: mockAttempts,
        totalCount: 3,
      });

      const result = await service.getProgramAttempts(params);

      expect(result.attempts).toEqual(mockAttempts);
      expect(result.totalCount).toBe(3);
      expect(result.currentPage).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(result.hasNextPage).toBe(false);
      expect(result.hasPreviousPage).toBe(false);

      expect(feedsRepository.findById).toHaveBeenCalledWith('feed-1');
      expect(
        attemptsRepository.findByFeedIdWithPagination,
      ).toHaveBeenCalledWith('feed-1', {
        limit: 20,
        offset: 0,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('フィードが存在しない場合、PersonalizedFeedNotFoundErrorがスローされること', async () => {
      feedsRepository.findById.mockResolvedValue(null);

      await expect(service.getProgramAttempts(params)).rejects.toThrow(
        PersonalizedFeedNotFoundError,
      );
    });

    it('ユーザーに権限がない場合、PersonalizedFeedNotFoundErrorがスローされること', async () => {
      const otherUserFeed = { ...mockFeed, userId: 'other-user' };
      feedsRepository.findById.mockResolvedValue(otherUserFeed);

      await expect(service.getProgramAttempts(params)).rejects.toThrow(
        PersonalizedFeedNotFoundError,
      );
    });

    it('ページネーション情報が正しく計算されること', async () => {
      feedsRepository.findById.mockResolvedValue(mockFeed);
      attemptsRepository.findByFeedIdWithPagination.mockResolvedValue({
        attempts: mockAttempts.slice(0, 2),
        totalCount: 25,
      });

      const result = await service.getProgramAttempts({
        ...params,
        page: 2,
        limit: 10,
      });

      expect(result.currentPage).toBe(2);
      expect(result.totalPages).toBe(3);
      expect(result.hasNextPage).toBe(true);
      expect(result.hasPreviousPage).toBe(true);
    });
  });

  describe('getProgramAttemptsStatistics', () => {
    it('フィード別番組生成試行統計情報を正常に計算できること', async () => {
      feedsRepository.findById.mockResolvedValue(mockFeed);
      attemptsRepository.findByFeedIdWithPagination.mockResolvedValue({
        attempts: mockAttempts,
        totalCount: 3,
      });

      const result = await service.getProgramAttemptsStatistics(
        'feed-1',
        'user-1',
      );

      expect(result.totalAttempts).toBe(3);
      expect(result.successCount).toBe(1);
      expect(result.skippedCount).toBe(1);
      expect(result.failedCount).toBe(1);
      expect(result.successRate).toBe(33.33);
      expect(result.lastAttemptDate).toEqual(new Date('2024-01-03'));
      expect(result.lastSuccessDate).toEqual(new Date('2024-01-03'));
    });

    it('試行履歴がない場合、適切な統計情報が返されること', async () => {
      feedsRepository.findById.mockResolvedValue(mockFeed);
      attemptsRepository.findByFeedIdWithPagination.mockResolvedValue({
        attempts: [],
        totalCount: 0,
      });

      const result = await service.getProgramAttemptsStatistics(
        'feed-1',
        'user-1',
      );

      expect(result.totalAttempts).toBe(0);
      expect(result.successCount).toBe(0);
      expect(result.skippedCount).toBe(0);
      expect(result.failedCount).toBe(0);
      expect(result.successRate).toBe(0);
      expect(result.lastAttemptDate).toBeUndefined();
      expect(result.lastSuccessDate).toBeUndefined();
    });
  });

  describe('getProgramAttemptsCount', () => {
    it('フィード別番組生成試行履歴件数を正常に取得できること', async () => {
      feedsRepository.findById.mockResolvedValue(mockFeed);
      attemptsRepository.countByFeedId.mockResolvedValue(5);

      const result = await service.getProgramAttemptsCount('feed-1', 'user-1');

      expect(result).toBe(5);
      expect(feedsRepository.findById).toHaveBeenCalledWith('feed-1');
      expect(attemptsRepository.countByFeedId).toHaveBeenCalledWith('feed-1');
    });
  });

  describe('validateFeedAccess', () => {
    it('フィードが存在しない場合、PersonalizedFeedNotFoundErrorがスローされること', async () => {
      feedsRepository.findById.mockResolvedValue(null);

      await expect(
        service.getProgramAttemptsCount('feed-1', 'user-1'),
      ).rejects.toThrow(PersonalizedFeedNotFoundError);
    });

    it('ユーザーに権限がない場合、PersonalizedFeedNotFoundErrorがスローされること', async () => {
      const otherUserFeed = { ...mockFeed, userId: 'other-user' };
      feedsRepository.findById.mockResolvedValue(otherUserFeed);

      await expect(
        service.getProgramAttemptsCount('feed-1', 'user-1'),
      ).rejects.toThrow(PersonalizedFeedNotFoundError);
    });
  });
});
