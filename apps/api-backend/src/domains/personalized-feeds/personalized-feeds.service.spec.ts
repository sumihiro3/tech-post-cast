import { FilterGroupDto } from '@/controllers/personalized-feeds/dto/create-personalized-feed.request.dto';
import { IAppUserRepository } from '@/domains/app-user/app-user.repository.interface';
import { UserNotFoundError } from '@/types/errors';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { IPersonalizedFeedsRepository } from './personalized-feeds.repository.interface';
import { PersonalizedFeedsService } from './personalized-feeds.service';

describe('PersonalizedFeedsService', () => {
  let service: PersonalizedFeedsService;
  let personalizedFeedsRepository: IPersonalizedFeedsRepository;
  let appUserRepository: IAppUserRepository;

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

  const mockFeed = {
    id: feedId,
    userId,
    name: 'テストフィード',
    dataSource: 'qiita',
    filterConfig: { tags: ['JavaScript'] },
    deliveryConfig: { frequency: 'daily' },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockFeedWithFilters = {
    ...mockFeed,
    filterGroups: [
      {
        id: 'group_test123',
        filterId: feedId,
        name: 'テストグループ',
        logicType: 'OR',
        createdAt: new Date(),
        updatedAt: new Date(),
        tagFilters: [
          {
            id: 'tag_test123',
            groupId: 'group_test123',
            tagName: 'JavaScript',
            createdAt: new Date(),
          },
        ],
        authorFilters: [
          {
            id: 'author_test123',
            groupId: 'group_test123',
            authorId: 'sumihiro3',
            createdAt: new Date(),
          },
        ],
      },
    ],
  };

  const mockFeedsResult = {
    feeds: [mockFeed],
    totalCount: 1,
    page: 1,
    perPage: 20,
  };

  const mockFeedsWithFiltersResult = {
    feeds: [mockFeedWithFilters],
    totalCount: 1,
    page: 1,
    perPage: 20,
  };

  // モックリポジトリ
  const mockPersonalizedFeedsRepository = {
    findByUserId: jest.fn(),
    findByUserIdWithFilters: jest.fn(),
    findById: jest.fn(),
    findByIdWithFilters: jest.fn(),
    createWithFilterGroup: jest.fn(),
    createFilterGroup: jest.fn(),
    createTagFilter: jest.fn(),
    createAuthorFilter: jest.fn(),
    updateWithFilterGroup: jest.fn(),
    softDelete: jest.fn(),
  };

  const mockAppUserRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PersonalizedFeedsService,
        {
          provide: 'IPersonalizedFeedsRepository',
          useValue: mockPersonalizedFeedsRepository,
        },
        {
          provide: 'IAppUserRepository',
          useValue: mockAppUserRepository,
        },
      ],
    }).compile();

    service = module.get<PersonalizedFeedsService>(PersonalizedFeedsService);
    personalizedFeedsRepository = module.get<IPersonalizedFeedsRepository>(
      'IPersonalizedFeedsRepository',
    );
    appUserRepository = module.get<IAppUserRepository>('IAppUserRepository');

    // モックのリセット
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(personalizedFeedsRepository).toBeDefined();
    expect(appUserRepository).toBeDefined();
  });

  describe('validateUserExists', () => {
    it('ユーザーが存在する場合はユーザー情報を返すこと', async () => {
      // Arrange
      mockAppUserRepository.findOne.mockResolvedValue(mockUser);

      // Act
      const result = await service.validateUserExists(userId);

      // Assert
      expect(appUserRepository.findOne).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUser);
    });

    it('ユーザーが存在しない場合はUserNotFoundErrorをスローすること', async () => {
      // Arrange
      mockAppUserRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.validateUserExists(userId)).rejects.toThrow(
        UserNotFoundError,
      );
    });

    it('ユーザーが無効化されている場合はUserNotFoundErrorをスローすること', async () => {
      // Arrange
      mockAppUserRepository.findOne.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      // Act & Assert
      await expect(service.validateUserExists(userId)).rejects.toThrow(
        UserNotFoundError,
      );
    });

    it('リポジトリからエラーが発生した場合はUserNotFoundErrorでラップすること', async () => {
      // Arrange
      const originalError = new Error('DB接続エラー');
      mockAppUserRepository.findOne.mockRejectedValue(originalError);

      // Act & Assert
      await expect(service.validateUserExists(userId)).rejects.toThrow(
        UserNotFoundError,
      );
    });
  });

  describe('findByUserId', () => {
    it('ユーザーに紐づくパーソナライズフィード一覧を取得できること', async () => {
      // Arrange
      mockAppUserRepository.findOne.mockResolvedValue(mockUser);
      mockPersonalizedFeedsRepository.findByUserId.mockResolvedValue(
        mockFeedsResult,
      );

      // Act
      const result = await service.findByUserId(userId);

      // Assert
      expect(appUserRepository.findOne).toHaveBeenCalledWith(userId);
      expect(personalizedFeedsRepository.findByUserId).toHaveBeenCalledWith(
        userId,
        1,
        20,
      );
      expect(result).toEqual(mockFeedsResult);
    });

    it('ページネーションパラメータを指定して一覧を取得できること', async () => {
      // Arrange
      const page = 2;
      const perPage = 10;
      mockAppUserRepository.findOne.mockResolvedValue(mockUser);
      mockPersonalizedFeedsRepository.findByUserId.mockResolvedValue({
        ...mockFeedsResult,
        page,
        perPage,
      });

      // Act
      const result = await service.findByUserId(userId, page, perPage);

      // Assert
      expect(personalizedFeedsRepository.findByUserId).toHaveBeenCalledWith(
        userId,
        page,
        perPage,
      );
      expect(result).toEqual(expect.objectContaining({ page, perPage }));
    });

    it('ユーザーが存在しない場合はUserNotFoundErrorをスローすること', async () => {
      // Arrange
      mockAppUserRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findByUserId(userId)).rejects.toThrow(
        UserNotFoundError,
      );
      expect(personalizedFeedsRepository.findByUserId).not.toHaveBeenCalled();
    });
  });

  describe('findByUserIdWithFilters', () => {
    it('フィルター情報を含むパーソナライズフィード一覧を取得できること', async () => {
      // Arrange
      mockAppUserRepository.findOne.mockResolvedValue(mockUser);
      mockPersonalizedFeedsRepository.findByUserIdWithFilters.mockResolvedValue(
        mockFeedsWithFiltersResult,
      );

      // Act
      const result = await service.findByUserIdWithFilters(userId);

      // Assert
      expect(appUserRepository.findOne).toHaveBeenCalledWith(userId);
      expect(
        personalizedFeedsRepository.findByUserIdWithFilters,
      ).toHaveBeenCalledWith(userId, 1, 20);
      expect(result).toEqual(mockFeedsWithFiltersResult);
    });

    it('ページネーションパラメータを指定して一覧を取得できること', async () => {
      // Arrange
      const page = 2;
      const perPage = 10;
      mockAppUserRepository.findOne.mockResolvedValue(mockUser);
      mockPersonalizedFeedsRepository.findByUserIdWithFilters.mockResolvedValue(
        {
          ...mockFeedsWithFiltersResult,
          page,
          perPage,
        },
      );

      // Act
      const result = await service.findByUserIdWithFilters(
        userId,
        page,
        perPage,
      );

      // Assert
      expect(
        personalizedFeedsRepository.findByUserIdWithFilters,
      ).toHaveBeenCalledWith(userId, page, perPage);
      expect(result).toEqual(expect.objectContaining({ page, perPage }));
    });

    it('ユーザーが存在しない場合はUserNotFoundErrorをスローすること', async () => {
      // Arrange
      mockAppUserRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findByUserIdWithFilters(userId)).rejects.toThrow(
        UserNotFoundError,
      );
      expect(
        personalizedFeedsRepository.findByUserIdWithFilters,
      ).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('指定されたIDのパーソナライズフィードを取得できること', async () => {
      // Arrange
      mockAppUserRepository.findOne.mockResolvedValue(mockUser);
      mockPersonalizedFeedsRepository.findById.mockResolvedValue(mockFeed);

      // Act
      const result = await service.findById(feedId, userId);

      // Assert
      expect(appUserRepository.findOne).toHaveBeenCalledWith(userId);
      expect(personalizedFeedsRepository.findById).toHaveBeenCalledWith(feedId);
      expect(result).toEqual(mockFeed);
    });

    it('フィードが存在しない場合はNotFoundExceptionをスローすること', async () => {
      // Arrange
      mockAppUserRepository.findOne.mockResolvedValue(mockUser);
      mockPersonalizedFeedsRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findById(feedId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('ユーザーに紐づかないフィードの場合はNotFoundExceptionをスローすること', async () => {
      // Arrange
      mockAppUserRepository.findOne.mockResolvedValue(mockUser);
      mockPersonalizedFeedsRepository.findById.mockResolvedValue({
        ...mockFeed,
        userId: 'different_user_id',
      });

      // Act & Assert
      await expect(service.findById(feedId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('ユーザーが存在しない場合はUserNotFoundErrorをスローすること', async () => {
      // Arrange
      mockAppUserRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findById(feedId, userId)).rejects.toThrow(
        UserNotFoundError,
      );
      expect(personalizedFeedsRepository.findById).not.toHaveBeenCalled();
    });
  });

  describe('findByIdWithFilters', () => {
    it('フィルター情報を含むパーソナライズフィードを取得できること', async () => {
      // Arrange
      mockAppUserRepository.findOne.mockResolvedValue(mockUser);
      mockPersonalizedFeedsRepository.findByIdWithFilters.mockResolvedValue(
        mockFeedWithFilters,
      );

      // Act
      const result = await service.findByIdWithFilters(feedId, userId);

      // Assert
      expect(appUserRepository.findOne).toHaveBeenCalledWith(userId);
      expect(
        personalizedFeedsRepository.findByIdWithFilters,
      ).toHaveBeenCalledWith(feedId);
      expect(result).toEqual(mockFeedWithFilters);
    });

    it('フィードが存在しない場合はNotFoundExceptionをスローすること', async () => {
      // Arrange
      mockAppUserRepository.findOne.mockResolvedValue(mockUser);
      mockPersonalizedFeedsRepository.findByIdWithFilters.mockResolvedValue(
        null,
      );

      // Act & Assert
      await expect(service.findByIdWithFilters(feedId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('ユーザーに紐づかないフィードの場合はNotFoundExceptionをスローすること', async () => {
      // Arrange
      mockAppUserRepository.findOne.mockResolvedValue(mockUser);
      mockPersonalizedFeedsRepository.findByIdWithFilters.mockResolvedValue({
        ...mockFeedWithFilters,
        userId: 'different_user_id',
      });

      // Act & Assert
      await expect(service.findByIdWithFilters(feedId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('ユーザーが存在しない場合はUserNotFoundErrorをスローすること', async () => {
      // Arrange
      mockAppUserRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findByIdWithFilters(feedId, userId)).rejects.toThrow(
        UserNotFoundError,
      );
      expect(
        personalizedFeedsRepository.findByIdWithFilters,
      ).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('フィルターグループなしでパーソナライズフィードを作成できること', async () => {
      // Arrange
      const name = 'テストフィード';
      const dataSource = 'qiita';
      const filterConfig = { tags: ['JavaScript'] };
      const deliveryConfig = { frequency: 'daily' };
      const isActive = true;

      mockAppUserRepository.findOne.mockResolvedValue(mockUser);
      mockPersonalizedFeedsRepository.createWithFilterGroup.mockResolvedValue({
        feed: mockFeed,
      });

      // Act
      const result = await service.create(
        userId,
        name,
        dataSource,
        filterConfig,
        deliveryConfig,
        isActive,
      );

      // Assert
      expect(appUserRepository.findOne).toHaveBeenCalledWith(userId);
      expect(
        personalizedFeedsRepository.createWithFilterGroup,
      ).toHaveBeenCalledWith({
        feed: {
          name,
          userId,
          dataSource,
          filterConfig,
          deliveryConfig,
          isActive,
        },
        filterGroup: undefined,
      });
      expect(result).toEqual(mockFeed);
    });

    it('フィルターグループありでパーソナライズフィードを作成できること', async () => {
      // Arrange
      const name = 'テストフィード';
      const dataSource = 'qiita';
      const filterConfig = { minLikes: 10 };
      const deliveryConfig = { frequency: 'daily' };
      const isActive = true;
      const filterGroups: FilterGroupDto[] = [
        {
          name: 'テストグループ',
          logicType: 'OR',
          tagFilters: [{ tagName: 'JavaScript' }],
          authorFilters: [{ authorId: 'sumihiro3' }],
        },
      ];

      mockAppUserRepository.findOne.mockResolvedValue(mockUser);
      mockPersonalizedFeedsRepository.createWithFilterGroup.mockResolvedValue({
        feed: mockFeed,
        filterGroup: {
          id: 'group_test123',
          filterId: feedId,
          name: 'テストグループ',
          logicType: 'OR',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        tagFilters: [
          {
            id: 'tag_test123',
            groupId: 'group_test123',
            tagName: 'JavaScript',
            createdAt: new Date(),
          },
        ],
        authorFilters: [
          {
            id: 'author_test123',
            groupId: 'group_test123',
            authorId: 'sumihiro3',
            createdAt: new Date(),
          },
        ],
      });

      // Act
      const result = await service.create(
        userId,
        name,
        dataSource,
        filterConfig,
        deliveryConfig,
        isActive,
        filterGroups,
      );

      // Assert
      expect(appUserRepository.findOne).toHaveBeenCalledWith(userId);
      expect(
        personalizedFeedsRepository.createWithFilterGroup,
      ).toHaveBeenCalledWith({
        feed: {
          name,
          userId,
          dataSource,
          filterConfig,
          deliveryConfig,
          isActive,
        },
        filterGroup: {
          name: filterGroups[0].name,
          logicType: filterGroups[0].logicType,
          tagFilters: filterGroups[0].tagFilters,
          authorFilters: filterGroups[0].authorFilters,
        },
      });
      expect(result).toEqual(mockFeed);
    });

    it('ユーザーが存在しない場合はUserNotFoundErrorをスローすること', async () => {
      // Arrange
      const name = 'テストフィード';
      const dataSource = 'qiita';
      const filterConfig = { tags: ['JavaScript'] };
      const deliveryConfig = { frequency: 'daily' };
      const isActive = true;

      mockAppUserRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.create(
          userId,
          name,
          dataSource,
          filterConfig,
          deliveryConfig,
          isActive,
        ),
      ).rejects.toThrow(UserNotFoundError);
      expect(
        personalizedFeedsRepository.createWithFilterGroup,
      ).not.toHaveBeenCalled();
    });

    it('リポジトリでエラーが発生した場合は例外をそのままスローすること', async () => {
      // Arrange
      const name = 'テストフィード';
      const dataSource = 'qiita';
      const filterConfig = { tags: ['JavaScript'] };
      const deliveryConfig = { frequency: 'daily' };
      const isActive = true;
      const originalError = new Error('作成エラー');

      mockAppUserRepository.findOne.mockResolvedValue(mockUser);
      mockPersonalizedFeedsRepository.createWithFilterGroup.mockRejectedValue(
        originalError,
      );

      // Act & Assert
      await expect(
        service.create(
          userId,
          name,
          dataSource,
          filterConfig,
          deliveryConfig,
          isActive,
        ),
      ).rejects.toThrow(originalError);
    });
  });

  describe('update', () => {
    it('パーソナライズフィードを更新できること', async () => {
      // Arrange
      const updates = {
        name: '更新テストフィード',
        dataSource: 'qiita',
        filterConfig: { tags: ['JavaScript', 'TypeScript'] },
        deliveryConfig: { frequency: 'weekly' },
      };

      const updatedFeed = {
        ...mockFeed,
        ...updates,
        updatedAt: new Date(),
      };

      const updatedFeedWithFilters = {
        ...updatedFeed,
        filterGroups: [],
      };

      mockAppUserRepository.findOne.mockResolvedValue(mockUser);
      mockPersonalizedFeedsRepository.findById.mockResolvedValue(mockFeed);
      mockPersonalizedFeedsRepository.updateWithFilterGroup.mockResolvedValue({
        feed: updatedFeed,
      });
      mockPersonalizedFeedsRepository.findByIdWithFilters.mockResolvedValue(
        updatedFeedWithFilters,
      );

      // Act
      const result = await service.update(feedId, userId, updates);

      // Assert
      expect(appUserRepository.findOne).toHaveBeenCalledWith(userId);
      expect(personalizedFeedsRepository.findById).toHaveBeenCalledWith(feedId);
      expect(
        personalizedFeedsRepository.updateWithFilterGroup,
      ).toHaveBeenCalledWith({
        feed: {
          id: feedId,
          ...updates,
        },
        filterGroup: undefined,
      });
      expect(
        personalizedFeedsRepository.findByIdWithFilters,
      ).toHaveBeenCalledWith(feedId);
      expect(result).toEqual(updatedFeedWithFilters);
    });

    it('フィルターグループありでパーソナライズフィードを更新できること', async () => {
      // Arrange
      const updates = {
        name: '更新テストフィード',
        dataSource: 'qiita',
        filterConfig: { minLikes: 15 },
        deliveryConfig: { frequency: 'weekly' },
      };

      const filterGroups: FilterGroupDto[] = [
        {
          name: '更新テストグループ',
          logicType: 'OR',
          tagFilters: [{ tagName: 'JavaScript' }, { tagName: 'TypeScript' }],
          authorFilters: [{ authorId: 'sumihiro3' }],
        },
      ];

      const updatedFeed = {
        ...mockFeed,
        ...updates,
        updatedAt: new Date(),
      };

      const updatedFeedWithFilters = {
        ...updatedFeed,
        filterGroups: [
          {
            id: 'group_test123',
            filterId: feedId,
            name: '更新テストグループ',
            logicType: 'OR',
            createdAt: new Date(),
            updatedAt: new Date(),
            tagFilters: [
              {
                id: 'tag_test123',
                groupId: 'group_test123',
                tagName: 'JavaScript',
                createdAt: new Date(),
              },
              {
                id: 'tag_test456',
                groupId: 'group_test123',
                tagName: 'TypeScript',
                createdAt: new Date(),
              },
            ],
            authorFilters: [
              {
                id: 'author_test123',
                groupId: 'group_test123',
                authorId: 'sumihiro3',
                createdAt: new Date(),
              },
            ],
          },
        ],
      };

      mockAppUserRepository.findOne.mockResolvedValue(mockUser);
      mockPersonalizedFeedsRepository.findById.mockResolvedValue(mockFeed);
      mockPersonalizedFeedsRepository.updateWithFilterGroup.mockResolvedValue({
        feed: updatedFeed,
        filterGroup: {
          id: 'group_test123',
          filterId: feedId,
          name: '更新テストグループ',
          logicType: 'OR',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        tagFilters: [
          {
            id: 'tag_test123',
            groupId: 'group_test123',
            tagName: 'JavaScript',
            createdAt: new Date(),
          },
          {
            id: 'tag_test456',
            groupId: 'group_test123',
            tagName: 'TypeScript',
            createdAt: new Date(),
          },
        ],
        authorFilters: [
          {
            id: 'author_test123',
            groupId: 'group_test123',
            authorId: 'sumihiro3',
            createdAt: new Date(),
          },
        ],
      });
      mockPersonalizedFeedsRepository.findByIdWithFilters.mockResolvedValue(
        updatedFeedWithFilters,
      );

      // Act
      const result = await service.update(
        feedId,
        userId,
        updates,
        filterGroups,
      );

      // Assert
      expect(appUserRepository.findOne).toHaveBeenCalledWith(userId);
      expect(personalizedFeedsRepository.findById).toHaveBeenCalledWith(feedId);
      expect(
        personalizedFeedsRepository.updateWithFilterGroup,
      ).toHaveBeenCalledWith({
        feed: {
          id: feedId,
          ...updates,
        },
        filterGroup: {
          name: filterGroups[0].name,
          logicType: filterGroups[0].logicType,
          tagFilters: filterGroups[0].tagFilters,
          authorFilters: filterGroups[0].authorFilters,
        },
      });
      expect(
        personalizedFeedsRepository.findByIdWithFilters,
      ).toHaveBeenCalledWith(feedId);
      expect(result).toEqual(updatedFeedWithFilters);
    });

    it('isActiveを指定して無効化できること', async () => {
      // Arrange
      const updates = {
        isActive: false,
      };

      const updatedFeed = {
        ...mockFeed,
        isActive: false,
        updatedAt: new Date(),
      };

      const updatedFeedWithFilters = {
        ...updatedFeed,
        filterGroups: [],
      };

      mockAppUserRepository.findOne.mockResolvedValue(mockUser);
      mockPersonalizedFeedsRepository.findById.mockResolvedValue(mockFeed);
      mockPersonalizedFeedsRepository.updateWithFilterGroup.mockResolvedValue({
        feed: updatedFeed,
      });
      mockPersonalizedFeedsRepository.findByIdWithFilters.mockResolvedValue(
        updatedFeedWithFilters,
      );

      // Act
      const result = await service.update(feedId, userId, updates);

      // Assert
      expect(
        personalizedFeedsRepository.updateWithFilterGroup,
      ).toHaveBeenCalledWith({
        feed: {
          id: feedId,
          isActive: false,
        },
        filterGroup: undefined,
      });
      expect(result.isActive).toBe(false);
    });

    it('フィードが存在しない場合はNotFoundExceptionをスローすること', async () => {
      // Arrange
      const updates = {
        name: '更新テストフィード',
      };

      mockAppUserRepository.findOne.mockResolvedValue(mockUser);
      mockPersonalizedFeedsRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.update(feedId, userId, updates)).rejects.toThrow(
        NotFoundException,
      );
      expect(
        personalizedFeedsRepository.updateWithFilterGroup,
      ).not.toHaveBeenCalled();
    });

    it('ユーザーが存在しない場合はUserNotFoundErrorをスローすること', async () => {
      // Arrange
      const updates = {
        name: '更新テストフィード',
      };

      mockAppUserRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.update(feedId, userId, updates)).rejects.toThrow(
        UserNotFoundError,
      );
      expect(personalizedFeedsRepository.findById).not.toHaveBeenCalled();
      expect(
        personalizedFeedsRepository.updateWithFilterGroup,
      ).not.toHaveBeenCalled();
    });

    it('リポジトリでエラーが発生した場合は例外をそのままスローすること', async () => {
      // Arrange
      const updates = {
        name: '更新テストフィード',
      };
      const originalError = new Error('更新エラー');

      mockAppUserRepository.findOne.mockResolvedValue(mockUser);
      mockPersonalizedFeedsRepository.findById.mockResolvedValue(mockFeed);
      mockPersonalizedFeedsRepository.updateWithFilterGroup.mockRejectedValue(
        originalError,
      );

      // Act & Assert
      await expect(service.update(feedId, userId, updates)).rejects.toThrow(
        originalError,
      );
    });
  });

  describe('delete', () => {
    it('パーソナライズフィードを論理削除できること', async () => {
      // Arrange
      const deletedFeed = {
        ...mockFeed,
        isActive: false,
        updatedAt: new Date(),
      };

      mockAppUserRepository.findOne.mockResolvedValue(mockUser);
      mockPersonalizedFeedsRepository.findById.mockResolvedValue(mockFeed);
      mockPersonalizedFeedsRepository.softDelete.mockResolvedValue(deletedFeed);

      // Act
      const result = await service.delete(feedId, userId);

      // Assert
      expect(appUserRepository.findOne).toHaveBeenCalledWith(userId);
      expect(personalizedFeedsRepository.findById).toHaveBeenCalledWith(feedId);
      expect(personalizedFeedsRepository.softDelete).toHaveBeenCalledWith(
        feedId,
      );
      expect(result).toEqual(deletedFeed);
      expect(result.isActive).toBe(false);
    });

    it('フィードが存在しない場合はNotFoundExceptionをスローすること', async () => {
      // Arrange
      mockAppUserRepository.findOne.mockResolvedValue(mockUser);
      mockPersonalizedFeedsRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.delete(feedId, userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(personalizedFeedsRepository.softDelete).not.toHaveBeenCalled();
    });

    it('ユーザーに紐づかないフィードの場合はNotFoundExceptionをスローすること', async () => {
      // Arrange
      mockAppUserRepository.findOne.mockResolvedValue(mockUser);
      mockPersonalizedFeedsRepository.findById.mockResolvedValue({
        ...mockFeed,
        userId: 'different_user_id',
      });

      // Act & Assert
      await expect(service.delete(feedId, userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(personalizedFeedsRepository.softDelete).not.toHaveBeenCalled();
    });

    it('ユーザーが存在しない場合はUserNotFoundErrorをスローすること', async () => {
      // Arrange
      mockAppUserRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.delete(feedId, userId)).rejects.toThrow(
        UserNotFoundError,
      );
      expect(personalizedFeedsRepository.findById).not.toHaveBeenCalled();
      expect(personalizedFeedsRepository.softDelete).not.toHaveBeenCalled();
    });

    it('リポジトリでエラーが発生した場合は例外をそのままスローすること', async () => {
      // Arrange
      const originalError = new Error('削除エラー');
      mockAppUserRepository.findOne.mockResolvedValue(mockUser);
      mockPersonalizedFeedsRepository.findById.mockResolvedValue(mockFeed);
      mockPersonalizedFeedsRepository.softDelete.mockRejectedValue(
        originalError,
      );

      // Act & Assert
      await expect(service.delete(feedId, userId)).rejects.toThrow(
        originalError,
      );
    });
  });
});
