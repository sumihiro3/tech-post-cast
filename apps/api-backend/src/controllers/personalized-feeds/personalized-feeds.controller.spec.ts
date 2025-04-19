import { PersonalizedFeedsService } from '@/domains/personalized-feeds/personalized-feeds.service';
import { UserNotFoundError } from '@/types/errors';
import { CanActivate, HttpException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ClerkJwtGuard } from '../../auth/guards/clerk-jwt.guard';
import {
  CreatePersonalizedFeedRequestDto,
  FilterGroupDto,
} from './dto/create-personalized-feed.request.dto';
import { PersonalizedFeedsController } from './personalized-feeds.controller';

describe('PersonalizedFeedsController', () => {
  let controller: PersonalizedFeedsController;
  let personalizedFeedsService: PersonalizedFeedsService;

  // モックデータ
  const userId = 'user_test123';
  const feedId = 'feed_test123';
  const mockUser = {
    id: userId,
    firstName: 'テスト',
    lastName: 'ユーザー',
    email: 'test@example.com',
    imageUrl: 'https://example.com/image.jpg',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignInAt: new Date(),
  };

  const currentDate = new Date();

  const mockFeed = {
    id: feedId,
    userId,
    name: 'テストフィード',
    dataSource: 'qiita',
    filterConfig: { tags: ['JavaScript'] },
    deliveryConfig: { frequency: 'daily' },
    isActive: true,
    createdAt: currentDate,
    updatedAt: currentDate,
  };

  const mockFeedWithFilters = {
    ...mockFeed,
    filterGroups: [
      {
        id: 'group_test123',
        filterId: feedId,
        name: 'テストグループ',
        logicType: 'OR',
        createdAt: currentDate,
        updatedAt: currentDate,
        tagFilters: [
          {
            id: 'tag_test123',
            groupId: 'group_test123',
            tagName: 'JavaScript',
            createdAt: currentDate,
          },
        ],
        authorFilters: [
          {
            id: 'author_test123',
            groupId: 'group_test123',
            authorId: 'sumihiro3',
            createdAt: currentDate,
          },
        ],
      },
    ],
  };

  const mockFeedsResult = {
    feeds: [mockFeed],
    total: 1,
  };

  const mockFeedsWithFiltersResult = {
    feeds: [mockFeedWithFilters],
    total: 1,
  };

  // モックサービス
  const mockPersonalizedFeedsService = {
    validateUserExists: jest.fn(),
    findByUserId: jest.fn(),
    findByUserIdWithFilters: jest.fn(),
    findById: jest.fn(),
    findByIdWithFilters: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const mockGuard: CanActivate = { canActivate: jest.fn(() => true) };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PersonalizedFeedsController],
      providers: [
        {
          provide: PersonalizedFeedsService,
          useValue: mockPersonalizedFeedsService,
        },
      ],
    }) // Guard は Mock を使うように設定
      // @see https://github.com/nestjs/nest/issues/4717
      .overrideGuard(ClerkJwtGuard)
      .useValue(mockGuard)
      .compile();

    controller = module.get<PersonalizedFeedsController>(
      PersonalizedFeedsController,
    );
    personalizedFeedsService = module.get<PersonalizedFeedsService>(
      PersonalizedFeedsService,
    );

    // モックのリセット
    jest.clearAllMocks();

    // 更新・削除用のモックを追加
    mockPersonalizedFeedsService.update = jest.fn();
    mockPersonalizedFeedsService.delete = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(personalizedFeedsService).toBeDefined();
  });

  describe('findFeeds', () => {
    it('includeFilters=trueの場合、フィルタ情報を含むフィード一覧を取得すること', async () => {
      // Arrange
      mockPersonalizedFeedsService.findByUserIdWithFilters.mockResolvedValue(
        mockFeedsWithFiltersResult,
      );

      // Act
      const result = await controller.getPersonalizedFeeds(
        {
          includeFilters: true,
        },
        userId,
      );

      // Assert
      expect(
        personalizedFeedsService.findByUserIdWithFilters,
      ).toHaveBeenCalledWith(userId, undefined, undefined);
      expect(result.feeds[0].id).toEqual(mockFeedWithFilters.id);
      expect(result.feeds[0].name).toEqual(mockFeedWithFilters.name);
      expect(result.feeds[0].dataSource).toEqual(
        mockFeedWithFilters.dataSource,
      );
      expect(result.feeds[0].filterConfig).toEqual(
        mockFeedWithFilters.filterConfig,
      );
      expect(result.feeds[0].deliveryConfig).toEqual(
        mockFeedWithFilters.deliveryConfig,
      );
      expect(result.feeds[0].isActive).toEqual(mockFeedWithFilters.isActive);
      expect(result.feeds[0].createdAt).toEqual(
        mockFeedWithFilters.createdAt.toISOString(),
      );
      expect(result.feeds[0].updatedAt).toEqual(
        mockFeedWithFilters.updatedAt.toISOString(),
      );
      // Type assertion to PersonalizedFeedWithFiltersDto
      expect((result.feeds[0] as any).filterGroups[0].id).toEqual(
        mockFeedWithFilters.filterGroups[0].id,
      );
      expect(result.total).toEqual(mockFeedsWithFiltersResult.total);
    });

    it('includeFilters=falseの場合、フィルタ情報を含まないフィード一覧を取得すること', async () => {
      // Arrange
      mockPersonalizedFeedsService.findByUserId.mockResolvedValue(
        mockFeedsResult,
      );

      // Act
      const result = await controller.getPersonalizedFeeds(
        {
          includeFilters: false,
        },
        userId,
      );

      // Assert
      expect(personalizedFeedsService.findByUserId).toHaveBeenCalledWith(
        userId,
        undefined,
        undefined,
      );
      expect(result.feeds[0].id).toEqual(mockFeed.id);
      expect(result.feeds[0].name).toEqual(mockFeed.name);
      expect(result.feeds[0].dataSource).toEqual(mockFeed.dataSource);
      expect(result.feeds[0].filterConfig).toEqual(mockFeed.filterConfig);
      expect(result.feeds[0].deliveryConfig).toEqual(mockFeed.deliveryConfig);
      expect(result.feeds[0].isActive).toEqual(mockFeed.isActive);
      expect(result.feeds[0].createdAt).toEqual(
        mockFeed.createdAt.toISOString(),
      );
      expect(result.feeds[0].updatedAt).toEqual(
        mockFeed.updatedAt.toISOString(),
      );
      expect(result.total).toEqual(mockFeedsResult.total);
    });

    it('includeFiltersが指定されていない場合、デフォルトでフィルタなしの一覧を取得すること', async () => {
      // Arrange
      mockPersonalizedFeedsService.findByUserId.mockResolvedValue(
        mockFeedsResult,
      );

      // Act
      const result = await controller.getPersonalizedFeeds({}, userId);

      // Assert
      expect(personalizedFeedsService.findByUserId).toHaveBeenCalledWith(
        userId,
        undefined,
        undefined,
      );
      expect(result.feeds[0].id).toEqual(mockFeed.id);
      expect(result.feeds[0].name).toEqual(mockFeed.name);
      expect(result.total).toEqual(mockFeedsResult.total);
    });

    it('ページネーションパラメータが指定された場合、それを使用すること', async () => {
      // Arrange
      const page = 2;
      const perPage = 10;
      const paginationResult = { ...mockFeedsResult, page, perPage };
      mockPersonalizedFeedsService.findByUserId.mockResolvedValue(
        paginationResult,
      );

      // Act
      const result = await controller.getPersonalizedFeeds(
        {
          includeFilters: false,
          page: page,
          perPage: perPage,
        },
        userId,
      );

      // Assert
      expect(personalizedFeedsService.findByUserId).toHaveBeenCalledWith(
        userId,
        page,
        perPage,
      );
      expect(result.feeds[0].id).toEqual(mockFeed.id);
      expect(result.feeds[0].name).toEqual(mockFeed.name);
      expect(result.total).toEqual(paginationResult.total);
    });

    it('UserNotFoundErrorが発生した場合、適切なエラーレスポンスを返すこと', async () => {
      // Arrange
      const error = new UserNotFoundError('ユーザーが見つかりません');
      mockPersonalizedFeedsService.findByUserId.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.getPersonalizedFeeds({}, userId)).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('findFeedById', () => {
    it('includeFilters=trueの場合、フィルタ情報を含むフィード詳細を取得すること', async () => {
      // Arrange
      mockPersonalizedFeedsService.findByIdWithFilters.mockResolvedValue(
        mockFeedWithFilters,
      );

      // Act
      const result = await controller.getPersonalizedFeed(feedId, userId);

      // Assert
      expect(personalizedFeedsService.findByIdWithFilters).toHaveBeenCalledWith(
        feedId,
        userId,
      );
      expect(result.feed.id).toEqual(mockFeedWithFilters.id);
      expect(result.feed.name).toEqual(mockFeedWithFilters.name);
      expect(result.feed.dataSource).toEqual(mockFeedWithFilters.dataSource);
      expect(result.feed.filterConfig).toEqual(
        mockFeedWithFilters.filterConfig,
      );
      expect(result.feed.createdAt).toEqual(
        mockFeedWithFilters.createdAt.toISOString(),
      );
      expect(result.feed.updatedAt).toEqual(
        mockFeedWithFilters.updatedAt.toISOString(),
      );
      // Type assertion as PersonalizedFeedWithFiltersDto
      expect((result.feed as any).filterGroups[0].id).toEqual(
        mockFeedWithFilters.filterGroups[0].id,
      );
    });

    it('NotFoundExceptionが発生した場合、適切なエラーレスポンスを返すこと', async () => {
      // Arrange
      const error = new NotFoundException('フィードが見つかりません');
      mockPersonalizedFeedsService.findByIdWithFilters.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.getPersonalizedFeed(feedId, userId),
      ).rejects.toThrow(HttpException);
    });

    it('UserNotFoundErrorが発生した場合、適切なエラーレスポンスを返すこと', async () => {
      // Arrange
      const error = new UserNotFoundError('ユーザーが見つかりません');
      mockPersonalizedFeedsService.findByIdWithFilters.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.getPersonalizedFeed(feedId, userId),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('createFeed', () => {
    it('フィルタグループなしでパーソナライズフィードを作成できること', async () => {
      // Arrange
      const createDto: CreatePersonalizedFeedRequestDto = {
        name: 'テストフィード',
        dataSource: 'qiita',
        filterConfig: { tags: ['JavaScript'] },
        deliveryConfig: { frequency: 'daily' },
        isActive: true,
      };

      mockPersonalizedFeedsService.create.mockResolvedValue(mockFeed);

      // Act
      const result = await controller.createPersonalizedFeed(createDto, userId);

      // Assert
      expect(personalizedFeedsService.create).toHaveBeenCalledWith(
        userId,
        createDto.name,
        createDto.dataSource,
        createDto.filterConfig,
        createDto.deliveryConfig,
        createDto.isActive,
        undefined,
      );
      expect(result.feed.id).toEqual(mockFeed.id);
      expect(result.feed.name).toEqual(mockFeed.name);
      expect(result.feed.dataSource).toEqual(mockFeed.dataSource);
      expect(result.feed.filterConfig).toEqual(mockFeed.filterConfig);
      expect(result.feed.deliveryConfig).toEqual(mockFeed.deliveryConfig);
      expect(result.feed.createdAt).toEqual(mockFeed.createdAt.toISOString());
      expect(result.feed.updatedAt).toEqual(mockFeed.updatedAt.toISOString());
    });

    it('フィルタグループありでパーソナライズフィードを作成できること', async () => {
      // Arrange
      const filterGroups: FilterGroupDto[] = [
        {
          name: 'テストグループ',
          logicType: 'OR',
          tagFilters: [{ tagName: 'JavaScript' }],
          authorFilters: [{ authorId: 'sumihiro3' }],
        },
      ];

      const createDto: CreatePersonalizedFeedRequestDto = {
        name: 'テストフィード',
        dataSource: 'qiita',
        filterConfig: { minLikes: 10 },
        deliveryConfig: { frequency: 'daily' },
        isActive: true,
        filterGroups,
      };

      mockPersonalizedFeedsService.create.mockResolvedValue(mockFeed);

      // Act
      const result = await controller.createPersonalizedFeed(createDto, userId);

      // Assert
      expect(personalizedFeedsService.create).toHaveBeenCalledWith(
        userId,
        createDto.name,
        createDto.dataSource,
        createDto.filterConfig,
        createDto.deliveryConfig,
        createDto.isActive,
        createDto.filterGroups,
      );
      expect(result.feed.id).toEqual(mockFeed.id);
      expect(result.feed.name).toEqual(mockFeed.name);
      expect(result.feed.dataSource).toEqual(mockFeed.dataSource);
      expect(result.feed.filterConfig).toEqual(mockFeed.filterConfig);
      expect(result.feed.deliveryConfig).toEqual(mockFeed.deliveryConfig);
      expect(result.feed.createdAt).toEqual(mockFeed.createdAt.toISOString());
      expect(result.feed.updatedAt).toEqual(mockFeed.updatedAt.toISOString());
    });

    it('UserNotFoundErrorが発生した場合、適切なエラーレスポンスを返すこと', async () => {
      // Arrange
      const createDto: CreatePersonalizedFeedRequestDto = {
        name: 'テストフィード',
        dataSource: 'qiita',
        filterConfig: { tags: ['JavaScript'] },
        deliveryConfig: { frequency: 'daily' },
        isActive: true,
      };

      const error = new UserNotFoundError('ユーザーが見つかりません');
      mockPersonalizedFeedsService.create.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.createPersonalizedFeed(createDto, userId),
      ).rejects.toThrow(HttpException);
    });

    it('一般的なエラーが発生した場合、適切なエラーレスポンスを返すこと', async () => {
      // Arrange
      const createDto: CreatePersonalizedFeedRequestDto = {
        name: 'テストフィード',
        dataSource: 'qiita',
        filterConfig: { tags: ['JavaScript'] },
        deliveryConfig: { frequency: 'daily' },
        isActive: true,
      };

      const error = new Error('予期せぬエラーが発生しました');
      mockPersonalizedFeedsService.create.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.createPersonalizedFeed(createDto, userId),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('updatePersonalizedFeed', () => {
    it('フィルターグループなしでパーソナライズフィードを更新できること', async () => {
      // Arrange
      const updateDto = {
        name: '更新されたフィード',
        dataSource: 'qiita',
        filterConfig: { tags: ['JavaScript', 'TypeScript'] },
        deliveryConfig: { frequency: 'weekly' },
      };

      const updatedFeedWithFilters = {
        ...mockFeedWithFilters,
        name: updateDto.name,
        dataSource: updateDto.dataSource,
        filterConfig: updateDto.filterConfig,
        deliveryConfig: updateDto.deliveryConfig,
        updatedAt: new Date(),
      };

      mockPersonalizedFeedsService.update.mockResolvedValue(
        updatedFeedWithFilters,
      );

      // Act
      const result = await controller.updatePersonalizedFeed(
        feedId,
        updateDto,
        userId,
      );

      // Assert
      expect(personalizedFeedsService.update).toHaveBeenCalledWith(
        feedId,
        userId,
        {
          name: updateDto.name,
          dataSource: updateDto.dataSource,
          filterConfig: updateDto.filterConfig,
          deliveryConfig: updateDto.deliveryConfig,
        },
        undefined,
      );
      expect(result.id).toEqual(updatedFeedWithFilters.id);
      expect(result.name).toEqual(updateDto.name);
      expect(result.dataSource).toEqual(updateDto.dataSource);
      expect(result.filterConfig).toEqual(updateDto.filterConfig);
      expect(result.deliveryConfig).toEqual(updateDto.deliveryConfig);
      expect(result.filterGroups).toBeDefined();
      expect(result.filterGroups.length).toEqual(
        updatedFeedWithFilters.filterGroups.length,
      );
    });

    it('フィルターグループありでパーソナライズフィードを更新できること', async () => {
      // Arrange
      const updateDto = {
        name: '更新されたフィード',
        dataSource: 'qiita',
        filterConfig: { tags: ['JavaScript', 'TypeScript'] },
        deliveryConfig: { frequency: 'weekly' },
        filterGroups: [
          {
            name: '更新されたグループ',
            logicType: 'OR',
            tagFilters: [{ tagName: 'JavaScript' }, { tagName: 'TypeScript' }],
            authorFilters: [{ authorId: 'sumihiro3' }],
          },
        ],
      };

      const updatedFeedWithFilters = {
        ...mockFeedWithFilters,
        name: updateDto.name,
        dataSource: updateDto.dataSource,
        filterConfig: updateDto.filterConfig,
        deliveryConfig: updateDto.deliveryConfig,
        updatedAt: new Date(),
        filterGroups: [
          {
            id: 'group_test123',
            filterId: feedId,
            name: '更新されたグループ',
            logicType: 'OR',
            createdAt: currentDate,
            updatedAt: new Date(),
            tagFilters: [
              {
                id: 'tag_test123',
                groupId: 'group_test123',
                tagName: 'JavaScript',
                createdAt: currentDate,
              },
              {
                id: 'tag_test456',
                groupId: 'group_test123',
                tagName: 'TypeScript',
                createdAt: currentDate,
              },
            ],
            authorFilters: [
              {
                id: 'author_test123',
                groupId: 'group_test123',
                authorId: 'sumihiro3',
                createdAt: currentDate,
              },
            ],
          },
        ],
      };

      mockPersonalizedFeedsService.update.mockResolvedValue(
        updatedFeedWithFilters,
      );

      // Act
      const result = await controller.updatePersonalizedFeed(
        feedId,
        updateDto,
        userId,
      );

      // Assert
      expect(personalizedFeedsService.update).toHaveBeenCalledWith(
        feedId,
        userId,
        {
          name: updateDto.name,
          dataSource: updateDto.dataSource,
          filterConfig: updateDto.filterConfig,
          deliveryConfig: updateDto.deliveryConfig,
        },
        updateDto.filterGroups,
      );
      expect(result.id).toEqual(updatedFeedWithFilters.id);
      expect(result.name).toEqual(updateDto.name);
      expect(result.dataSource).toEqual(updateDto.dataSource);
      expect(result.filterConfig).toEqual(updateDto.filterConfig);
      expect(result.deliveryConfig).toEqual(updateDto.deliveryConfig);
      expect(result.filterGroups).toBeDefined();
      expect(result.filterGroups.length).toEqual(1);
      expect(result.filterGroups[0].name).toEqual('更新されたグループ');
      expect(result.filterGroups[0].tagFilters.length).toEqual(2);
      expect(result.filterGroups[0].authorFilters.length).toEqual(1);
    });

    it('isActiveを指定して無効化できること', async () => {
      // Arrange
      const updateDto = {
        isActive: false,
      };

      const updatedFeedWithFilters = {
        ...mockFeedWithFilters,
        isActive: false,
        updatedAt: new Date(),
      };

      mockPersonalizedFeedsService.update.mockResolvedValue(
        updatedFeedWithFilters,
      );

      // Act
      const result = await controller.updatePersonalizedFeed(
        feedId,
        updateDto,
        userId,
      );

      // Assert
      expect(personalizedFeedsService.update).toHaveBeenCalledWith(
        feedId,
        userId,
        {
          isActive: false,
        },
        undefined,
      );
      expect(result.id).toEqual(updatedFeedWithFilters.id);
      expect(result.isActive).toBe(false);
    });

    it('NotFoundExceptionが発生した場合、適切なエラーレスポンスを返すこと', async () => {
      // Arrange
      const updateDto = {
        name: '更新されたフィード',
      };
      const error = new NotFoundException('フィードが見つかりません');
      mockPersonalizedFeedsService.update.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.updatePersonalizedFeed(feedId, updateDto, userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('UserNotFoundErrorが発生した場合、適切なエラーレスポンスを返すこと', async () => {
      // Arrange
      const updateDto = {
        name: '更新されたフィード',
      };
      const error = new UserNotFoundError('ユーザーが見つかりません');
      mockPersonalizedFeedsService.update.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.updatePersonalizedFeed(feedId, updateDto, userId),
      ).rejects.toThrow(HttpException);
    });

    it('一般的なエラーが発生した場合、適切なエラーレスポンスを返すこと', async () => {
      // Arrange
      const updateDto = {
        name: '更新されたフィード',
      };
      const error = new Error('予期せぬエラーが発生しました');
      mockPersonalizedFeedsService.update.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.updatePersonalizedFeed(feedId, updateDto, userId),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('deletePersonalizedFeed', () => {
    it('パーソナライズフィードを論理削除できること', async () => {
      // Arrange
      const updatedAt = new Date();
      const deletedFeed = {
        ...mockFeed,
        isActive: false,
        updatedAt,
      };

      mockPersonalizedFeedsService.delete.mockResolvedValue(deletedFeed);

      // Act
      const result = await controller.deletePersonalizedFeed(feedId, userId);

      // Assert
      expect(personalizedFeedsService.delete).toHaveBeenCalledWith(
        feedId,
        userId,
      );
      expect(result.id).toEqual(deletedFeed.id);
      expect(result.userId).toEqual(deletedFeed.userId);
      expect(result.name).toEqual(deletedFeed.name);
      expect(result.isActive).toBe(false);
    });

    it('NotFoundExceptionが発生した場合、適切なエラーレスポンスを返すこと', async () => {
      // Arrange
      const error = new NotFoundException('フィードが見つかりません');
      mockPersonalizedFeedsService.delete.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.deletePersonalizedFeed(feedId, userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('UserNotFoundErrorが発生した場合、適切なエラーレスポンスを返すこと', async () => {
      // Arrange
      const error = new UserNotFoundError('ユーザーが見つかりません');
      mockPersonalizedFeedsService.delete.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.deletePersonalizedFeed(feedId, userId),
      ).rejects.toThrow(HttpException);
    });

    it('一般的なエラーが発生した場合、適切なエラーレスポンスを返すこと', async () => {
      // Arrange
      const error = new Error('予期せぬエラーが発生しました');
      mockPersonalizedFeedsService.delete.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.deletePersonalizedFeed(feedId, userId),
      ).rejects.toThrow(HttpException);
    });
  });
});
