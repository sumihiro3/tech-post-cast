import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClientManager } from '@tech-post-cast/database';
import { DeliveryFrequency } from '@prisma/client';
import { PersonalizedFeedsRepository } from './personalized-feeds.repository';
import { suppressLogOutput, restoreLogOutput } from '../../../test/helpers/logger.helper';
import { PersonalizedFeedError } from '../../../types/errors/personalized-feed.error';
import { PersonalizedFeed } from '../../../domains/personalized-feeds/personalized-feeds.entity';
import { UpdateFeedParams } from '../../../domains/personalized-feeds/personalized-feeds.repository.interface';

describe('PersonalizedFeedsRepository', () => {
  let repository: PersonalizedFeedsRepository;
  let prismaClientManager: jest.Mocked<PrismaClientManager>;
  let logSpies: jest.SpyInstance[];
  let mockPrismaClient: any;

  beforeEach(async () => {
    logSpies = suppressLogOutput();

    mockPrismaClient = {
      personalizedFeed: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      feedFilterGroup: {
        create: jest.fn(),
        update: jest.fn(),
      },
      tagFilter: {
        create: jest.fn(),
      },
      authorFilter: {
        create: jest.fn(),
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
        PersonalizedFeedsRepository,
        {
          provide: PrismaClientManager,
          useValue: prismaClientManager,
        },
      ],
    }).compile();

    repository = module.get<PersonalizedFeedsRepository>(PersonalizedFeedsRepository);
  });

  afterEach(() => {
    restoreLogOutput(logSpies);
  });

  describe('findById', () => {
    it('指定したIDのパーソナライズフィードを取得できること', async () => {
      const feedId = 'feed-1';
      const mockFeed = {
        id: feedId,
        userId: 'user-1',
        name: 'テストフィード',
        description: 'テスト用のフィード',
        dataSource: 'qiita',
        filterConfig: {},
        deliveryConfig: {},
        deliveryFrequency: DeliveryFrequency.DAILY,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaClient.personalizedFeed.findUnique.mockResolvedValue(mockFeed);

      const result = await repository.findById(feedId);

      expect(result).toBeDefined();
      expect(result.id).toBe(feedId);
      expect(result.name).toBe('テストフィード');
      expect(mockPrismaClient.personalizedFeed.findUnique).toHaveBeenCalledWith({
        where: { id: feedId },
      });
    });

    it('フィードが存在しない場合、nullを返すこと', async () => {
      const feedId = 'non-existent-feed';

      mockPrismaClient.personalizedFeed.findUnique.mockResolvedValue(null);

      const result = await repository.findById(feedId);

      expect(result).toBeNull();
      expect(mockPrismaClient.personalizedFeed.findUnique).toHaveBeenCalledWith({
        where: { id: feedId },
      });
    });
  });

  describe('findByUserId', () => {
    it('ユーザーIDに基づいてパーソナライズフィードを取得できること', async () => {
      const userId = 'user-1';
      const mockFeeds = [
        {
          id: 'feed-1',
          userId,
          name: 'テストフィード1',
          description: 'テスト用のフィード1',
          dataSource: 'qiita',
          filterConfig: {},
          deliveryConfig: {},
          deliveryFrequency: DeliveryFrequency.DAILY,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'feed-2',
          userId,
          name: 'テストフィード2',
          description: 'テスト用のフィード2',
          dataSource: 'qiita',
          filterConfig: {},
          deliveryConfig: {},
          deliveryFrequency: DeliveryFrequency.WEEKLY,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaClient.personalizedFeed.count.mockResolvedValue(2);
      mockPrismaClient.personalizedFeed.findMany.mockResolvedValue(mockFeeds);

      const result = await repository.findByUserId(userId);

      expect(result).toBeDefined();
      expect(result.feeds.length).toBe(2);
      expect(result.feeds[0].id).toBe('feed-1');
      expect(result.feeds[1].id).toBe('feed-2');
      expect(result.total).toBe(2);
      expect(mockPrismaClient.personalizedFeed.findMany).toHaveBeenCalledWith({
        where: { userId, isActive: true },
        orderBy: { updatedAt: 'desc' },
        skip: 0,
        take: 20,
      });
    });

    it('ページネーションパラメータを指定して取得できること', async () => {
      const userId = 'user-1';
      const page = 2;
      const perPage = 10;
      const mockFeeds = [
        {
          id: 'feed-3',
          userId,
          name: 'テストフィード3',
          description: 'テスト用のフィード3',
          dataSource: 'qiita',
          filterConfig: {},
          deliveryConfig: {},
          deliveryFrequency: DeliveryFrequency.DAILY,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaClient.personalizedFeed.count.mockResolvedValue(11);
      mockPrismaClient.personalizedFeed.findMany.mockResolvedValue(mockFeeds);

      const result = await repository.findByUserId(userId, page, perPage);

      expect(result).toBeDefined();
      expect(result.feeds.length).toBe(1);
      expect(result.total).toBe(11);
      expect(mockPrismaClient.personalizedFeed.findMany).toHaveBeenCalledWith({
        where: { userId, isActive: true },
        orderBy: { updatedAt: 'desc' },
        skip: 10, // (page - 1) * perPage
        take: perPage,
      });
    });
  });

  describe('countByUserId', () => {
    it('ユーザーIDに基づいてパーソナライズフィードの数を取得できること', async () => {
      const userId = 'user-1';
      
      mockPrismaClient.personalizedFeed.count.mockResolvedValue(5);

      const result = await repository.countByUserId(userId);

      expect(result).toBe(5);
      expect(mockPrismaClient.personalizedFeed.count).toHaveBeenCalledWith({
        where: { userId, isActive: true },
      });
    });
  });

  describe('create', () => {
    it('新しいパーソナライズフィードを作成できること', async () => {
      const feedData = {
        userId: 'user-1',
        name: '新しいフィード',
        dataSource: 'qiita',
        filterConfig: {},
        deliveryConfig: {},
        deliveryFrequency: DeliveryFrequency.DAILY,
        isActive: true,
      } as Omit<PersonalizedFeed, 'id' | 'createdAt' | 'updatedAt'>;

      const mockFeed = {
        id: 'feed-1',
        ...feedData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaClient.personalizedFeed.create.mockResolvedValue(mockFeed);

      const result = await repository.create(feedData);

      expect(result).toBeDefined();
      expect(result.id).toBe('feed-1');
      expect(result.name).toBe('新しいフィード');
      expect(mockPrismaClient.personalizedFeed.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: feedData.userId,
          name: feedData.name,
          dataSource: feedData.dataSource,
          filterConfig: feedData.filterConfig,
          deliveryConfig: feedData.deliveryConfig,
          deliveryFrequency: feedData.deliveryFrequency,
          isActive: feedData.isActive,
        }),
      });
    });
  });

  describe('createFilterGroup', () => {
    it('新しいフィルターグループを作成できること', async () => {
      const params = {
        filterId: 'filter-1',
        name: 'テストグループ',
        logicType: 'AND',
      };

      const mockGroup = {
        id: 'group-1',
        ...params,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaClient.feedFilterGroup.create.mockResolvedValue(mockGroup);

      const result = await repository.createFilterGroup(params);

      expect(result).toBeDefined();
      expect(result.id).toBe('group-1');
      expect(result.name).toBe('テストグループ');
      expect(result.logicType).toBe('AND');
      expect(mockPrismaClient.feedFilterGroup.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          filterId: params.filterId,
          name: params.name,
          logicType: params.logicType,
        }),
      });
    });
  });

  describe('createTagFilter', () => {
    it('新しいタグフィルターを作成できること', async () => {
      const params = {
        groupId: 'group-1',
        tagName: 'javascript',
      };

      const mockTagFilter = {
        id: 'tag-filter-1',
        ...params,
        createdAt: new Date(),
      };

      mockPrismaClient.tagFilter.create.mockResolvedValue(mockTagFilter);

      const result = await repository.createTagFilter(params);

      expect(result).toBeDefined();
      expect(result.id).toBe('tag-filter-1');
      expect(result.tagName).toBe('javascript');
      expect(mockPrismaClient.tagFilter.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          groupId: params.groupId,
          tagName: params.tagName,
        }),
      });
    });
  });

  describe('createAuthorFilter', () => {
    it('新しい著者フィルターを作成できること', async () => {
      const params = {
        groupId: 'group-1',
        authorId: 'author-1',
      };

      const mockAuthorFilter = {
        id: 'author-filter-1',
        ...params,
        createdAt: new Date(),
      };

      mockPrismaClient.authorFilter.create.mockResolvedValue(mockAuthorFilter);

      const result = await repository.createAuthorFilter(params);

      expect(result).toBeDefined();
      expect(result.id).toBe('author-filter-1');
      expect(result.authorId).toBe('author-1');
      expect(mockPrismaClient.authorFilter.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          groupId: params.groupId,
          authorId: params.authorId,
        }),
      });
    });
  });

  describe('update', () => {
    it('パーソナライズフィードを更新できること', async () => {
      const feedId = 'feed-1';
      const updateData: UpdateFeedParams = {
        id: feedId,
        name: '更新したフィード',
        deliveryFrequency: DeliveryFrequency.WEEKLY,
      };

      const mockExistingFeed = {
        id: feedId,
        userId: 'user-1',
        name: '元のフィード',
        dataSource: 'qiita',
        filterConfig: {},
        deliveryConfig: {},
        deliveryFrequency: DeliveryFrequency.DAILY,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdatedFeed = {
        ...mockExistingFeed,
        name: updateData.name,
        deliveryFrequency: updateData.deliveryFrequency,
        updatedAt: new Date(),
      };

      mockPrismaClient.personalizedFeed.update.mockResolvedValue(mockUpdatedFeed);

      const result = await repository.update(updateData);

      expect(result).toBeDefined();
      expect(result.name).toBe('更新したフィード');
      expect(result.deliveryFrequency).toBe('WEEKLY');
      expect(mockPrismaClient.personalizedFeed.update).toHaveBeenCalledWith({
        where: { id: feedId },
        data: expect.objectContaining({
          name: updateData.name,
          deliveryFrequency: updateData.deliveryFrequency,
        }),
      });
    });
  });

  describe('softDelete', () => {
    it('パーソナライズフィードを論理削除できること', async () => {
      const feedId = 'feed-1';
      const mockExistingFeed = {
        id: feedId,
        userId: 'user-1',
        name: 'テストフィード',
        description: 'テスト用のフィード',
        dataSource: 'qiita',
        filterConfig: {},
        deliveryConfig: {},
        deliveryFrequency: DeliveryFrequency.DAILY,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockDeletedFeed = {
        ...mockExistingFeed,
        isActive: false,
        updatedAt: new Date(),
      };

      mockPrismaClient.personalizedFeed.update.mockResolvedValue(mockDeletedFeed);

      const result = await repository.softDelete(feedId);

      expect(result).toBeDefined();
      expect(result.isActive).toBe(false);
      expect(mockPrismaClient.personalizedFeed.update).toHaveBeenCalledWith({
        where: { id: feedId },
        data: expect.objectContaining({ isActive: false }),
      });
    });
  });
});
