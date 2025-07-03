import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClientManager } from '@tech-post-cast/database';
import { PersonalizedProgramAttemptFactory } from '../../../test/factories/personalized-program-attempt.factory';
import {
  restoreLogOutput,
  suppressLogOutput,
} from '../../../test/helpers/logger.helper';
import {
  PersonalizedProgramAttemptDatabaseError,
  PersonalizedProgramAttemptRetrievalError,
} from '../../../types/errors';
import { PersonalizedProgramAttemptsRepository } from './personalized-program-attempts.repository';

describe('PersonalizedProgramAttemptsRepository', () => {
  let repository: PersonalizedProgramAttemptsRepository;
  let prismaClientManager: jest.Mocked<PrismaClientManager>;
  let logSpies: jest.SpyInstance[];
  let mockPrismaClient: any;

  beforeEach(async () => {
    logSpies = suppressLogOutput();

    mockPrismaClient = {
      personalizedProgramAttempt: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
    };

    prismaClientManager = {
      getClient: jest.fn().mockReturnValue(mockPrismaClient),
      transaction: jest.fn().mockImplementation(async (callback) => {
        return await callback();
      }),
    } as unknown as jest.Mocked<PrismaClientManager>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PersonalizedProgramAttemptsRepository,
        {
          provide: PrismaClientManager,
          useValue: prismaClientManager,
        },
      ],
    }).compile();

    repository = module.get<PersonalizedProgramAttemptsRepository>(
      PersonalizedProgramAttemptsRepository,
    );
  });

  afterEach(() => {
    restoreLogOutput(logSpies);
    jest.clearAllMocks();
  });

  describe('findByFeedIdWithPagination', () => {
    const feedId = 'feed-1';
    const options = { limit: 10, offset: 0 };

    it('指定フィードIDの番組生成試行履歴一覧を正常に取得できること', async () => {
      const mockAttempts = [
        PersonalizedProgramAttemptFactory.createSuccessfulAttempt({
          id: 'attempt-1',
          userId: 'user-1',
          feedId: 'feed-1',
          createdAt: new Date('2024-01-01'),
        }),
        PersonalizedProgramAttemptFactory.createFailedAttempt({
          id: 'attempt-2',
          userId: 'user-1',
          feedId: 'feed-1',
          reason: 'NOT_ENOUGH_POSTS',
          createdAt: new Date('2024-01-02'),
        }),
      ];

      mockPrismaClient.personalizedProgramAttempt.count.mockResolvedValue(2);
      mockPrismaClient.personalizedProgramAttempt.findMany.mockResolvedValue(
        mockAttempts,
      );

      const result = await repository.findByFeedIdWithPagination(
        feedId,
        options,
      );

      expect(result.attempts).toEqual(mockAttempts);
      expect(result.totalCount).toBe(2);
      expect(
        mockPrismaClient.personalizedProgramAttempt.count,
      ).toHaveBeenCalledWith({
        where: { feedId },
      });
      expect(
        mockPrismaClient.personalizedProgramAttempt.findMany,
      ).toHaveBeenCalledWith({
        where: { feedId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 0,
      });
    });

    it('データベースエラーが発生した場合、PersonalizedProgramAttemptRetrievalErrorがスローされること', async () => {
      const error = new Error('Database connection failed');
      mockPrismaClient.personalizedProgramAttempt.count.mockRejectedValue(
        error,
      );

      await expect(
        repository.findByFeedIdWithPagination(feedId, options),
      ).rejects.toThrow(PersonalizedProgramAttemptRetrievalError);
    });
  });

  describe('countByFeedId', () => {
    const feedId = 'feed-1';

    it('指定フィードIDの番組生成試行履歴件数を正常に取得できること', async () => {
      mockPrismaClient.personalizedProgramAttempt.count.mockResolvedValue(5);

      const result = await repository.countByFeedId(feedId);

      expect(result).toBe(5);
      expect(
        mockPrismaClient.personalizedProgramAttempt.count,
      ).toHaveBeenCalledWith({
        where: { feedId },
      });
    });

    it('データベースエラーが発生した場合、PersonalizedProgramAttemptDatabaseErrorがスローされること', async () => {
      const error = new Error('Database connection failed');
      mockPrismaClient.personalizedProgramAttempt.count.mockRejectedValue(
        error,
      );

      await expect(repository.countByFeedId(feedId)).rejects.toThrow(
        PersonalizedProgramAttemptDatabaseError,
      );
    });
  });

  describe('findByUserIdWithPagination', () => {
    const userId = 'user-1';
    const options = { limit: 10, offset: 0 };

    it('指定ユーザーIDの番組生成試行履歴一覧を正常に取得できること', async () => {
      const mockAttempts = [
        PersonalizedProgramAttemptFactory.createSuccessfulAttempt({
          id: 'attempt-1',
          userId: 'user-1',
          feedId: 'feed-1',
          createdAt: new Date('2024-01-01'),
        }),
      ];

      mockPrismaClient.personalizedProgramAttempt.count.mockResolvedValue(1);
      mockPrismaClient.personalizedProgramAttempt.findMany.mockResolvedValue(
        mockAttempts,
      );

      const result = await repository.findByUserIdWithPagination(
        userId,
        options,
      );

      expect(result.attempts).toEqual(mockAttempts);
      expect(result.totalCount).toBe(1);
      expect(
        mockPrismaClient.personalizedProgramAttempt.count,
      ).toHaveBeenCalledWith({
        where: { userId },
      });
    });
  });

  describe('findById', () => {
    const attemptId = 'attempt-1';

    it('指定IDの番組生成試行履歴を正常に取得できること', async () => {
      const mockAttempt =
        PersonalizedProgramAttemptFactory.createSuccessfulAttempt({
          id: 'attempt-1',
          userId: 'user-1',
          feedId: 'feed-1',
          postCount: 3,
          programId: 'program-1',
          createdAt: new Date('2024-01-01'),
        });

      mockPrismaClient.personalizedProgramAttempt.findUnique.mockResolvedValue(
        mockAttempt,
      );

      const result = await repository.findById(attemptId);

      expect(result).toEqual(mockAttempt);
      expect(
        mockPrismaClient.personalizedProgramAttempt.findUnique,
      ).toHaveBeenCalledWith({
        where: { id: attemptId },
      });
    });

    it('指定IDの番組生成試行履歴が存在しない場合、nullを返すこと', async () => {
      mockPrismaClient.personalizedProgramAttempt.findUnique.mockResolvedValue(
        null,
      );

      const result = await repository.findById(attemptId);

      expect(result).toBeNull();
      expect(
        mockPrismaClient.personalizedProgramAttempt.findUnique,
      ).toHaveBeenCalledWith({
        where: { id: attemptId },
      });
    });

    it('データベースエラーが発生した場合、PersonalizedProgramAttemptRetrievalErrorがスローされること', async () => {
      const error = new Error('Database connection failed');
      mockPrismaClient.personalizedProgramAttempt.findUnique.mockRejectedValue(
        error,
      );

      await expect(repository.findById(attemptId)).rejects.toThrow(
        PersonalizedProgramAttemptRetrievalError,
      );
    });
  });

  describe('findByUserIdWithRelationsForDashboard', () => {
    const userId = 'user-1';
    const options = {
      limit: 10,
      offset: 0,
      orderBy: { createdAt: 'desc' as const },
    };

    it('指定ユーザーIDの番組生成試行履歴一覧を関連データ付きで正常に取得できること', async () => {
      const mockAttemptsWithRelations = [
        {
          id: 'attempt-1',
          userId: 'user-1',
          status: 'SUCCESS',
          reason: null,
          postCount: 3,
          createdAt: new Date('2024-01-01'),
          feed: {
            id: 'feed-1',
            name: 'テストフィード1',
          },
          program: {
            id: 'program-1',
            title: 'テスト番組1',
            expiresAt: new Date('2024-02-01'),
            isExpired: false,
          },
        },
        {
          id: 'attempt-2',
          userId: 'user-1',
          status: 'FAILED',
          reason: 'NOT_ENOUGH_POSTS',
          postCount: 1,
          createdAt: new Date('2024-01-02'),
          feed: {
            id: 'feed-2',
            name: 'テストフィード2',
          },
          program: null,
        },
      ];

      mockPrismaClient.personalizedProgramAttempt.count.mockResolvedValue(2);
      mockPrismaClient.personalizedProgramAttempt.findMany.mockResolvedValue(
        mockAttemptsWithRelations,
      );

      const result = await repository.findByUserIdWithRelationsForDashboard(
        userId,
        undefined,
        options,
      );

      expect(result.attempts).toEqual(mockAttemptsWithRelations);
      expect(result.totalCount).toBe(2);
      expect(
        mockPrismaClient.personalizedProgramAttempt.count,
      ).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(
        mockPrismaClient.personalizedProgramAttempt.findMany,
      ).toHaveBeenCalledWith({
        where: { userId },
        include: {
          feed: {
            select: {
              id: true,
              name: true,
            },
          },
          program: {
            select: {
              id: true,
              title: true,
              expiresAt: true,
              isExpired: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 0,
      });
    });

    it('feedIdが指定された場合、そのfeedIdでフィルタリングされること', async () => {
      const feedId = 'feed-1';
      const mockAttemptsWithRelations = [
        {
          id: 'attempt-1',
          userId: 'user-1',
          status: 'SUCCESS',
          reason: null,
          postCount: 3,
          createdAt: new Date('2024-01-01'),
          feed: {
            id: 'feed-1',
            name: 'テストフィード1',
          },
          program: {
            id: 'program-1',
            title: 'テスト番組1',
            expiresAt: new Date('2024-02-01'),
            isExpired: false,
          },
        },
      ];

      mockPrismaClient.personalizedProgramAttempt.count.mockResolvedValue(1);
      mockPrismaClient.personalizedProgramAttempt.findMany.mockResolvedValue(
        mockAttemptsWithRelations,
      );

      const result = await repository.findByUserIdWithRelationsForDashboard(
        userId,
        feedId,
        options,
      );

      expect(result.attempts).toEqual(mockAttemptsWithRelations);
      expect(result.totalCount).toBe(1);
      expect(
        mockPrismaClient.personalizedProgramAttempt.count,
      ).toHaveBeenCalledWith({
        where: { userId, feedId },
      });
      expect(
        mockPrismaClient.personalizedProgramAttempt.findMany,
      ).toHaveBeenCalledWith({
        where: { userId, feedId },
        include: {
          feed: {
            select: {
              id: true,
              name: true,
            },
          },
          program: {
            select: {
              id: true,
              title: true,
              expiresAt: true,
              isExpired: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 0,
      });
    });

    it('データが存在しない場合でも正常に動作すること', async () => {
      mockPrismaClient.personalizedProgramAttempt.count.mockResolvedValue(0);
      mockPrismaClient.personalizedProgramAttempt.findMany.mockResolvedValue(
        [],
      );

      const result = await repository.findByUserIdWithRelationsForDashboard(
        userId,
        undefined,
        options,
      );

      expect(result.attempts).toEqual([]);
      expect(result.totalCount).toBe(0);
    });

    it('データベースエラーが発生した場合、PersonalizedProgramAttemptRetrievalErrorがスローされること', async () => {
      const error = new Error('Database connection failed');
      mockPrismaClient.personalizedProgramAttempt.count.mockRejectedValue(
        error,
      );

      await expect(
        repository.findByUserIdWithRelationsForDashboard(
          userId,
          undefined,
          options,
        ),
      ).rejects.toThrow(PersonalizedProgramAttemptRetrievalError);
    });
  });
});
