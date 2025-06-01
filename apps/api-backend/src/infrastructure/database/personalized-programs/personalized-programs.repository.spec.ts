import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClientManager } from '@tech-post-cast/database';
import { PersonalizedProgramFactory } from '../../../test/factories/personalized-program.factory';
import {
  restoreLogOutput,
  suppressLogOutput,
} from '../../../test/helpers/logger.helper';
import {
  PersonalizedProgramDatabaseError,
  PersonalizedProgramRetrievalError,
} from '../../../types/errors';
import { PersonalizedProgramsRepository } from './personalized-programs.repository';

describe('PersonalizedProgramsRepository', () => {
  let repository: PersonalizedProgramsRepository;
  let prismaClientManager: jest.Mocked<PrismaClientManager>;
  let logSpies: jest.SpyInstance[];
  let mockPrismaClient: any;

  beforeEach(async () => {
    logSpies = suppressLogOutput();

    mockPrismaClient = {
      personalizedFeedProgram: {
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
        PersonalizedProgramsRepository,
        {
          provide: PrismaClientManager,
          useValue: prismaClientManager,
        },
      ],
    }).compile();

    repository = module.get<PersonalizedProgramsRepository>(
      PersonalizedProgramsRepository,
    );
  });

  afterEach(() => {
    restoreLogOutput(logSpies);
  });

  describe('findByUserIdWithPagination', () => {
    it('指定ユーザーのパーソナルプログラム一覧をページネーション付きで取得できること', async () => {
      const userId = 'user-1';
      const options = {
        limit: 10,
        offset: 0,
        orderBy: { createdAt: 'desc' as const },
      };
      const mockPrograms = [
        PersonalizedProgramFactory.createPersonalizedProgram(),
      ];
      const totalCount = 1;

      mockPrismaClient.personalizedFeedProgram.count.mockResolvedValue(
        totalCount,
      );
      mockPrismaClient.personalizedFeedProgram.findMany.mockResolvedValue(
        mockPrograms,
      );

      const result = await repository.findByUserIdWithPagination(
        userId,
        options,
      );

      expect(result).toBeDefined();
      expect(result.programs).toHaveLength(1);
      expect(result.totalCount).toBe(totalCount);
      expect(result.programs[0].id).toBe('program-1');
      expect(result.programs[0].title).toBe('テストプログラム1');
      expect(result.programs[0].feed.name).toBe('テストフィード1');
      expect(result.programs[0].posts).toHaveLength(1);

      expect(
        mockPrismaClient.personalizedFeedProgram.count,
      ).toHaveBeenCalledWith({
        where: {
          userId,
          feed: {
            isActive: true,
          },
          isExpired: false,
          OR: [{ expiresAt: null }, { expiresAt: { gt: expect.any(Date) } }],
        },
      });
      expect(
        mockPrismaClient.personalizedFeedProgram.findMany,
      ).toHaveBeenCalledWith({
        where: {
          userId,
          feed: {
            isActive: true,
          },
          isExpired: false,
          OR: [{ expiresAt: null }, { expiresAt: { gt: expect.any(Date) } }],
        },
        include: {
          feed: {
            select: {
              id: true,
              name: true,
              dataSource: true,
              isActive: true,
            },
          },
          posts: {
            select: {
              id: true,
              title: true,
              url: true,
              likesCount: true,
              stocksCount: true,
              createdAt: true,
              updatedAt: true,
              authorId: true,
              authorName: true,
              private: true,
              refreshedAt: true,
              summary: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 0,
      });
    });

    it('データベースエラーが発生した場合、PersonalizedProgramRetrievalErrorをスローすること', async () => {
      const userId = 'user-1';
      const options = { limit: 10, offset: 0 };
      const dbError = new Error('Database connection failed');

      mockPrismaClient.personalizedFeedProgram.count.mockRejectedValue(dbError);

      await expect(
        repository.findByUserIdWithPagination(userId, options),
      ).rejects.toThrow(PersonalizedProgramRetrievalError);

      expect(
        mockPrismaClient.personalizedFeedProgram.count,
      ).toHaveBeenCalledWith({
        where: {
          userId,
          feed: {
            isActive: true,
          },
          isExpired: false,
          OR: [{ expiresAt: null }, { expiresAt: { gt: expect.any(Date) } }],
        },
      });
    });

    it('空の結果を正しく処理できること', async () => {
      const userId = 'user-1';
      const options = { limit: 10, offset: 0 };

      mockPrismaClient.personalizedFeedProgram.count.mockResolvedValue(0);
      mockPrismaClient.personalizedFeedProgram.findMany.mockResolvedValue([]);

      const result = await repository.findByUserIdWithPagination(
        userId,
        options,
      );

      expect(result).toBeDefined();
      expect(result.programs).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });
  });

  describe('findAllByUserIdForStats', () => {
    it('指定ユーザーの全パーソナルプログラム一覧を取得できること（有効期限切れも含む）', async () => {
      const userId = 'user-1';
      const options = {
        limit: 10,
        offset: 0,
        orderBy: { createdAt: 'desc' as const },
      };
      const mockPrograms = [
        PersonalizedProgramFactory.createPersonalizedProgram(),
        PersonalizedProgramFactory.createExpiredPersonalizedProgram(),
      ];
      const totalCount = 2;

      mockPrismaClient.personalizedFeedProgram.count.mockResolvedValue(
        totalCount,
      );
      mockPrismaClient.personalizedFeedProgram.findMany.mockResolvedValue(
        mockPrograms,
      );

      const result = await repository.findAllByUserIdForStats(userId, options);

      expect(result).toBeDefined();
      expect(result.programs).toHaveLength(2);
      expect(result.totalCount).toBe(totalCount);
      expect(result.programs[0].id).toBe('program-1');
      expect(result.programs[1].isExpired).toBe(true);

      expect(
        mockPrismaClient.personalizedFeedProgram.count,
      ).toHaveBeenCalledWith({
        where: {
          userId,
          feed: {
            isActive: true,
          },
        },
      });
      expect(
        mockPrismaClient.personalizedFeedProgram.findMany,
      ).toHaveBeenCalledWith({
        where: {
          userId,
          feed: {
            isActive: true,
          },
        },
        include: {
          feed: {
            select: {
              id: true,
              name: true,
              dataSource: true,
              isActive: true,
            },
          },
          posts: {
            select: {
              id: true,
              title: true,
              url: true,
              likesCount: true,
              stocksCount: true,
              createdAt: true,
              updatedAt: true,
              authorId: true,
              authorName: true,
              private: true,
              refreshedAt: true,
              summary: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 0,
      });
    });

    it('データベースエラーが発生した場合、PersonalizedProgramRetrievalErrorをスローすること', async () => {
      const userId = 'user-1';
      const options = { limit: 10, offset: 0 };
      const dbError = new Error('Database connection failed');

      mockPrismaClient.personalizedFeedProgram.count.mockRejectedValue(dbError);

      await expect(
        repository.findAllByUserIdForStats(userId, options),
      ).rejects.toThrow(PersonalizedProgramRetrievalError);

      expect(
        mockPrismaClient.personalizedFeedProgram.count,
      ).toHaveBeenCalledWith({
        where: {
          userId,
          feed: {
            isActive: true,
          },
        },
      });
    });

    it('空の結果を正しく処理できること', async () => {
      const userId = 'user-1';
      const options = { limit: 10, offset: 0 };

      mockPrismaClient.personalizedFeedProgram.count.mockResolvedValue(0);
      mockPrismaClient.personalizedFeedProgram.findMany.mockResolvedValue([]);

      const result = await repository.findAllByUserIdForStats(userId, options);

      expect(result).toBeDefined();
      expect(result.programs).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });
  });

  describe('findById', () => {
    it('指定IDのパーソナルプログラムを取得できること', async () => {
      const programId = 'program-1';
      const mockProgram = PersonalizedProgramFactory.createPersonalizedProgram({
        id: programId,
      });

      mockPrismaClient.personalizedFeedProgram.findUnique.mockResolvedValue(
        mockProgram,
      );

      const result = await repository.findById(programId);

      expect(result).toBeDefined();
      expect(result!.id).toBe(programId);
      expect(result!.title).toBe('テストプログラム1');
      expect(result!.feed.name).toBe('テストフィード1');
      expect(result!.posts).toHaveLength(1);

      expect(
        mockPrismaClient.personalizedFeedProgram.findUnique,
      ).toHaveBeenCalledWith({
        where: {
          id: programId,
          feed: {
            isActive: true,
          },
          isExpired: false,
          OR: [{ expiresAt: null }, { expiresAt: { gt: expect.any(Date) } }],
        },
        include: {
          feed: {
            select: {
              id: true,
              name: true,
              dataSource: true,
              isActive: true,
            },
          },
          posts: {
            select: {
              id: true,
              title: true,
              url: true,
              likesCount: true,
              stocksCount: true,
              createdAt: true,
              updatedAt: true,
              authorId: true,
              authorName: true,
              private: true,
              refreshedAt: true,
              summary: true,
            },
          },
        },
      });
    });

    it('プログラムが存在しない場合、nullを返すこと', async () => {
      const programId = 'non-existent-program';

      mockPrismaClient.personalizedFeedProgram.findUnique.mockResolvedValue(
        null,
      );

      const result = await repository.findById(programId);

      expect(result).toBeNull();
      expect(
        mockPrismaClient.personalizedFeedProgram.findUnique,
      ).toHaveBeenCalledWith({
        where: {
          id: programId,
          feed: {
            isActive: true,
          },
          isExpired: false,
          OR: [{ expiresAt: null }, { expiresAt: { gt: expect.any(Date) } }],
        },
        include: {
          feed: {
            select: {
              id: true,
              name: true,
              dataSource: true,
              isActive: true,
            },
          },
          posts: {
            select: {
              id: true,
              title: true,
              url: true,
              likesCount: true,
              stocksCount: true,
              createdAt: true,
              updatedAt: true,
              authorId: true,
              authorName: true,
              private: true,
              refreshedAt: true,
              summary: true,
            },
          },
        },
      });
    });

    it('データベースエラーが発生した場合、PersonalizedProgramDatabaseErrorをスローすること', async () => {
      const programId = 'program-1';
      const dbError = new Error('Database connection failed');

      mockPrismaClient.personalizedFeedProgram.findUnique.mockRejectedValue(
        dbError,
      );

      await expect(repository.findById(programId)).rejects.toThrow(
        PersonalizedProgramDatabaseError,
      );

      expect(
        mockPrismaClient.personalizedFeedProgram.findUnique,
      ).toHaveBeenCalledWith({
        where: {
          id: programId,
          feed: {
            isActive: true,
          },
          isExpired: false,
          OR: [{ expiresAt: null }, { expiresAt: { gt: expect.any(Date) } }],
        },
        include: {
          feed: {
            select: {
              id: true,
              name: true,
              dataSource: true,
              isActive: true,
            },
          },
          posts: {
            select: {
              id: true,
              title: true,
              url: true,
              likesCount: true,
              stocksCount: true,
              createdAt: true,
              updatedAt: true,
              authorId: true,
              authorName: true,
              private: true,
              refreshedAt: true,
              summary: true,
            },
          },
        },
      });
    });
  });
});
