import { PersonalizedFeedsService } from '@/domains/personalized-feeds/personalized-feeds.service';
import { UserNotFoundError } from '@/types/errors';
import { CanActivate, HttpException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionInfo, SubscriptionStatus } from '@tech-post-cast/database';
import { ClerkJwtGuard } from '../../auth/guards/clerk-jwt.guard';
import { SubscriptionGuard } from '../../guards/subscription.guard';
import { CreatePersonalizedFeedRequestDto } from './dto/create-personalized-feed.request.dto';
import { UpdatePersonalizedFeedRequestDto } from './dto/update-personalized-feed.request.dto';
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
        dateRangeFilters: [
          {
            id: 'daterange_test123',
            groupId: 'group_test123',
            daysAgo: 30,
            createdAt: currentDate,
          },
        ],
      },
    ],
  };

  const mockSubscription: SubscriptionInfo = {
    id: 'subscription_test123',
    userId,
    planId: 'plan_test123',
    status: SubscriptionStatus.ACTIVE,
    startDate: currentDate,
    endDate: new Date(currentDate.getTime() + 1000 * 60 * 60 * 24 * 30),
    isActive: true,
    plan: {
      id: 'plan_test123',
      name: 'テストプラン',
      price: 1000,
      description: 'テストプラン',
      maxFeeds: 10,
      maxAuthors: 10,
      maxTags: 10,
    },
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
      .overrideGuard(SubscriptionGuard)
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
    it('公開日フィルターを含むパーソナライズフィードを作成できること', async () => {
      // サービスからの返却値をモック
      mockPersonalizedFeedsService.create.mockResolvedValue(
        mockFeedWithFilters,
      );

      // リクエストDTOを作成
      const createDto: CreatePersonalizedFeedRequestDto = {
        name: 'テストフィード',
        dataSource: 'qiita',
        filterConfig: { minLikes: 5 },
        deliveryConfig: { frequency: 'daily', time: '08:00' },
        filterGroups: [
          {
            name: 'テストグループ',
            logicType: 'OR',
            tagFilters: [],
            authorFilters: [],
            dateRangeFilters: [{ daysAgo: 30 }],
            likesCountFilters: [{ minLikes: 5 }],
          },
        ],
        isActive: true,
      };

      // コントローラーメソッドを実行
      const result = await controller.createPersonalizedFeed(
        createDto,
        userId,
        mockSubscription,
      );

      // 期待値の検証
      expect(personalizedFeedsService.create).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          name: createDto.name,
          dataSource: createDto.dataSource,
          filterConfig: createDto.filterConfig,
          deliveryConfig: createDto.deliveryConfig,
          isActive: createDto.isActive,
          filterGroups: expect.arrayContaining([
            expect.objectContaining({
              name: 'テストグループ',
              logicType: 'OR',
              dateRangeFilters: expect.arrayContaining([{ daysAgo: 30 }]),
              likesCountFilters: expect.arrayContaining([{ minLikes: 5 }]),
            }),
          ]),
        }),
        mockSubscription,
      );
      expect(result).toBeDefined();
      expect(result.feed).toBeDefined();
      expect(result.feed.id).toBe(mockFeedWithFilters.id);
    });

    it('ユーザーが存在しない場合はNotFoundExceptionをスローすること', async () => {
      // サービスからUserNotFoundErrorをスローするモック
      mockPersonalizedFeedsService.create.mockRejectedValue(
        new UserNotFoundError('user_nonexistent'),
      );

      // リクエストDTOを作成
      const createDto: CreatePersonalizedFeedRequestDto = {
        name: 'テストフィード',
        dataSource: 'qiita',
        filterConfig: {},
        deliveryConfig: {},
        isActive: true,
      };

      // コントローラーメソッドを実行して例外検証
      await expect(
        controller.createPersonalizedFeed(createDto, userId, mockSubscription),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updatePersonalizedFeed', () => {
    it('公開日フィルターを含むパーソナライズフィードを更新できること', async () => {
      // 更新後のフィードをモック
      const updatedFeed = {
        ...mockFeedWithFilters,
        name: '更新されたフィード名',
        filterGroups: [
          {
            ...mockFeedWithFilters.filterGroups[0],
            name: '更新されたフィルターグループ',
            dateRangeFilters: [
              {
                ...mockFeedWithFilters.filterGroups[0].dateRangeFilters[0],
                daysAgo: 60,
              },
            ],
          },
        ],
      };

      // サービスからの返却値をモック
      mockPersonalizedFeedsService.update.mockResolvedValue(updatedFeed);

      // リクエストDTOを作成
      const updateDto: UpdatePersonalizedFeedRequestDto = {
        name: '更新されたフィード名',
        filterGroups: [
          {
            name: '更新されたフィルターグループ',
            logicType: 'OR',
            dateRangeFilters: [{ daysAgo: 60 }],
            likesCountFilters: [{ minLikes: 10 }],
          },
        ],
      };

      // コントローラーメソッドを実行
      const result = await controller.updatePersonalizedFeed(
        feedId,
        updateDto,
        userId,
        mockSubscription,
      );

      // 期待値の検証
      expect(personalizedFeedsService.update).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          id: feedId,
          name: updateDto.name,
          filterGroups: expect.arrayContaining([
            expect.objectContaining({
              name: '更新されたフィルターグループ',
              logicType: 'OR',
              dateRangeFilters: expect.arrayContaining([{ daysAgo: 60 }]),
              likesCountFilters: expect.arrayContaining([{ minLikes: 10 }]),
            }),
          ]),
        }),
      );
      expect(result).toBeDefined();
      expect(result.id).toBe(feedId);
      expect(result.name).toBe('更新されたフィード名');
      expect(result.filterGroups[0].dateRangeFilters[0].daysAgo).toBe(60);
    });

    it('存在しないフィードの更新を試みるとNotFoundExceptionをスローすること', async () => {
      // サービスからNotFoundExceptionをスローするモック
      mockPersonalizedFeedsService.update.mockRejectedValue(
        new NotFoundException(
          'パーソナライズフィード [nonexistent_feed] は存在しません',
        ),
      );

      // リクエストDTOを作成
      const updateDto: UpdatePersonalizedFeedRequestDto = {
        name: '更新されたフィード名',
      };

      // コントローラーメソッドを実行して例外検証
      await expect(
        controller.updatePersonalizedFeed(
          'nonexistent_feed',
          updateDto,
          userId,
          mockSubscription,
        ),
      ).rejects.toThrow(NotFoundException);
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
