import { IAppUsersRepository } from '@/domains/app-users/app-users.repository.interface';
import {
  PersonalizedFeedCreationLimitError,
  UserNotFoundError,
} from '@/types/errors';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DeliveryFrequency, SpeakerMode } from '@prisma/client';
import { SubscriptionInfo, SubscriptionStatus } from '@tech-post-cast/database';
import { ISubscriptionRepository } from '../subscription/subscription.repository.interface';
import {
  PersonalizedFeed,
  PersonalizedFeedWithFilters,
} from './personalized-feeds.entity';
import { IPersonalizedFeedsRepository } from './personalized-feeds.repository.interface';
import { PersonalizedFeedsService } from './personalized-feeds.service';
import {
  CreatePersonalizedFeedParams,
  UpdatePersonalizedFeedParams,
} from './personalized-feeds.types';

describe('PersonalizedFeedsService', () => {
  let service: PersonalizedFeedsService;
  let personalizedFeedsRepository: jest.Mocked<IPersonalizedFeedsRepository>;
  let appUserRepository: jest.Mocked<IAppUsersRepository>;
  let subscriptionRepository: jest.Mocked<ISubscriptionRepository>;

  const userId = 'user_123456';

  const mockUser = {
    id: userId,
    firstName: 'テスト', // 追加
    lastName: 'ユーザー', // 追加
    displayName: 'テストユーザー',
    email: 'test@example.com',
    imageUrl: 'https://example.com/image.jpg',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignInAt: new Date(),
    stripeCustomerId: 'cus_123456',
    defaultPaymentMethodId: 'pm_123456',
    slackWebhookUrl: null,
    notificationEnabled: false,
    // RSS機能関連フィールド
    rssToken: null,
    rssEnabled: false,
    rssCreatedAt: null,
    rssUpdatedAt: null,
    // パーソナルプログラム関連フィールド
    personalizedProgramDialogueEnabled: false,
  };

  const mockPersonalizedFeed = {
    id: 'feed_123456',
    userId: 'user_123456',
    name: 'テスト用フィード',
    dataSource: 'qiita',
    filterConfig: { minLikes: 5 },
    deliveryConfig: { frequency: 'daily', time: '08:00' },
    deliveryFrequency: DeliveryFrequency.WEEKLY,
    speakerMode: SpeakerMode.SINGLE,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDateRangeFilter = {
    id: 'daterange_123456',
    groupId: 'group_123456',
    daysAgo: 30,
    createdAt: new Date(),
  };

  const mockFilterGroup = {
    id: 'group_123456',
    filterId: 'feed_123456',
    name: 'テスト用フィルターグループ',
    logicType: 'OR',
    tagFilters: [],
    authorFilters: [],
    dateRangeFilters: [mockDateRangeFilter],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPersonalizedFeedWithFilters = {
    ...mockPersonalizedFeed,
    filterGroups: [mockFilterGroup],
  };

  const currentDate = new Date();
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

  beforeEach(async () => {
    personalizedFeedsRepository = {
      findByUserId: jest.fn(),
      findByUserIdWithFilters: jest.fn(),
      findById: jest.fn(),
      findByIdWithFilters: jest.fn(),
      create: jest.fn(),
      createFilterGroup: jest.fn(),
      createTagFilter: jest.fn(),
      createAuthorFilter: jest.fn(),
      createDateRangeFilter: jest.fn(),
      createWithFilterGroup: jest.fn(),
      update: jest.fn(),
      updateFilterGroup: jest.fn(),
      deleteTagFiltersByGroupId: jest.fn(),
      deleteAuthorFiltersByGroupId: jest.fn(),
      deleteDateRangeFiltersByGroupId: jest.fn(),
      updateWithFilterGroup: jest.fn(),
      softDelete: jest.fn(),
      countByUserId: jest.fn().mockResolvedValue(0),
    } as unknown as jest.Mocked<IPersonalizedFeedsRepository>;

    appUserRepository = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<IAppUsersRepository>;

    subscriptionRepository = {
      findByUserId: jest.fn(),
      getPlanLimits: jest.fn().mockResolvedValue({
        maxFeeds: 10,
        maxTags: 5,
        maxAuthors: 5,
      }),
    } as unknown as jest.Mocked<ISubscriptionRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PersonalizedFeedsService,
        {
          provide: 'PersonalizedFeedsRepository',
          useValue: personalizedFeedsRepository,
        },
        {
          provide: 'AppUsersRepository',
          useValue: appUserRepository,
        },
        {
          provide: 'SubscriptionRepository',
          useValue: subscriptionRepository,
        },
      ],
    }).compile();

    service = module.get<PersonalizedFeedsService>(PersonalizedFeedsService);
  });

  describe('create', () => {
    it('公開日フィルターを含むパーソナライズフィードを作成できること', async () => {
      appUserRepository.findOne.mockResolvedValue(mockUser);

      personalizedFeedsRepository.createWithFilterGroup.mockResolvedValue({
        feed: mockPersonalizedFeed as PersonalizedFeed,
        filterGroup: mockFilterGroup,
        tagFilters: [],
        authorFilters: [],
        dateRangeFilters: [mockDateRangeFilter],
      });

      subscriptionRepository.findByUserId.mockResolvedValue(mockSubscription);

      const mockCheckFeedCreationLimits = jest.fn();
      service.checkFeedCreationLimits = mockCheckFeedCreationLimits;

      const filterGroupDto = {
        name: 'テスト用フィルターグループ',
        logicType: 'OR',
        tagFilters: [],
        authorFilters: [],
        dateRangeFilters: [{ daysAgo: 30 }],
      };

      // パラメータオブジェクトを作成
      const createParams: CreatePersonalizedFeedParams = {
        name: 'テスト用フィード',
        dataSource: 'qiita',
        filterConfig: { minLikes: 5 },
        deliveryConfig: { frequency: 'daily', time: '08:00' },
        deliveryFrequency: DeliveryFrequency.WEEKLY,
        speakerMode: SpeakerMode.SINGLE,
        isActive: true,
        filterGroups: [filterGroupDto],
      };

      const result = await service.create(
        'user_123456',
        createParams,
        mockSubscription,
      );

      expect(appUserRepository.findOne).toHaveBeenCalledWith('user_123456');
      expect(
        personalizedFeedsRepository.createWithFilterGroup,
      ).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.id).toBe('feed_123456');
      expect(result.filterGroups.length).toBe(1);
      expect(result.filterGroups[0].dateRangeFilters.length).toBe(1);
      expect(result.filterGroups[0].dateRangeFilters[0].daysAgo).toBe(30);
      expect(mockCheckFeedCreationLimits).toHaveBeenCalledTimes(1);
    });

    it('ユーザーが存在しない場合はエラーになること', async () => {
      appUserRepository.findOne.mockResolvedValue(null);

      // パラメータオブジェクトを作成
      const createParams: CreatePersonalizedFeedParams = {
        name: 'テスト用フィード',
        dataSource: 'qiita',
        filterConfig: {},
        deliveryConfig: {},
        deliveryFrequency: DeliveryFrequency.WEEKLY,
        speakerMode: SpeakerMode.SINGLE,
        isActive: true,
        filterGroups: [],
      };

      await expect(
        service.create('nonexistent_user', createParams, mockSubscription),
      ).rejects.toThrow(UserNotFoundError);
    });
  });

  describe('update', () => {
    it('公開日フィルターを含むパーソナライズフィードを更新できること', async () => {
      appUserRepository.findOne.mockResolvedValue(mockUser);

      personalizedFeedsRepository.findById.mockResolvedValue(
        mockPersonalizedFeed as PersonalizedFeed,
      );

      personalizedFeedsRepository.updateWithFilterGroup.mockResolvedValue({
        feed: {
          ...mockPersonalizedFeed,
          name: '更新されたフィード名',
        } as PersonalizedFeed,
        filterGroup: {
          ...mockFilterGroup,
          name: '更新されたフィルターグループ名',
        },
        tagFilters: [],
        authorFilters: [],
        dateRangeFilters: [{ ...mockDateRangeFilter, daysAgo: 60 }],
      });

      personalizedFeedsRepository.findByIdWithFilters.mockResolvedValue({
        ...mockPersonalizedFeed,
        name: '更新されたフィード名',
        filterGroups: [
          {
            ...mockFilterGroup,
            name: '更新されたフィルターグループ名',
            dateRangeFilters: [{ ...mockDateRangeFilter, daysAgo: 60 }],
          },
        ],
      } as PersonalizedFeedWithFilters);

      const filterGroupDto = {
        name: '更新されたフィルターグループ名',
        logicType: 'OR',
        tagFilters: [],
        authorFilters: [],
        dateRangeFilters: [{ daysAgo: 60 }],
      };

      // UpdatePersonalizedFeedParamsオブジェクトを作成
      const updateParams: UpdatePersonalizedFeedParams = {
        id: 'feed_123456',
        name: '更新されたフィード名',
        filterGroups: [filterGroupDto],
      };

      const result = await service.update(
        'user_123456',
        updateParams,
        mockSubscription,
      );

      expect(personalizedFeedsRepository.findById).toHaveBeenCalledWith(
        'feed_123456',
      );
      expect(
        personalizedFeedsRepository.updateWithFilterGroup,
      ).toHaveBeenCalled();
      expect(
        personalizedFeedsRepository.findByIdWithFilters,
      ).toHaveBeenCalledWith('feed_123456');

      expect(result).toBeDefined();
      expect(result.name).toBe('更新されたフィード名');
      expect(result.filterGroups.length).toBe(1);
      expect(result.filterGroups[0].name).toBe(
        '更新されたフィルターグループ名',
      );
      expect(result.filterGroups[0].dateRangeFilters.length).toBe(1);
      expect(result.filterGroups[0].dateRangeFilters[0].daysAgo).toBe(60);
    });

    it('存在しないフィードの更新を試みるとエラーになること', async () => {
      appUserRepository.findOne.mockResolvedValue(mockUser);

      personalizedFeedsRepository.findById.mockResolvedValue(null);

      // UpdatePersonalizedFeedParamsオブジェクトを作成
      const updateParams: UpdatePersonalizedFeedParams = {
        id: 'nonexistent_feed',
        name: '更新されたフィード名',
      };

      await expect(
        service.update('user_123456', updateParams, mockSubscription),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('checkFeedCreationLimits', () => {
    it('アクティブなサブスクリプションでフィード作成制限内の場合、エラーを投げない', async () => {
      // Arrange
      mockSubscription.plan.maxFeeds = 10;
      personalizedFeedsRepository.countByUserId.mockResolvedValue(5); // 5フィード（上限10）

      // Act & Assert
      await expect(
        service.checkFeedCreationLimits(
          mockUser,
          mockSubscription,
          mockPersonalizedFeedWithFilters,
        ),
      ).resolves.not.toThrow();
    });

    it('アクティブでないサブスクリプションの場合、エラーを投げる', async () => {
      // Arrange
      mockSubscription.status = SubscriptionStatus.EXPIRED;
      // Act & Assert
      await expect(
        service.checkFeedCreationLimits(
          mockUser,
          mockSubscription,
          mockPersonalizedFeedWithFilters,
        ),
      ).rejects.toThrow(PersonalizedFeedCreationLimitError);
    });

    it('新規フィード作成時、フィード数が上限に達した場合はエラーを投げる', async () => {
      // Arrange
      mockSubscription.plan.maxFeeds = 10;
      personalizedFeedsRepository.countByUserId.mockResolvedValue(10); // 10フィード（上限10）

      const params = {
        ...mockPersonalizedFeedWithFilters,
      };
      delete params['id'];
      delete params['userId'];
      delete params['createdAt'];
      delete params['updatedAt'];
      const createParams: CreatePersonalizedFeedParams = params;

      // Act & Assert
      await expect(
        service.checkFeedCreationLimits(
          mockUser,
          mockSubscription,
          createParams,
        ),
      ).rejects.toThrow(PersonalizedFeedCreationLimitError);
    });

    it('フィード更新時、フィード数が上限を超えている場合はエラーを投げる', async () => {
      // Arrange
      mockSubscription.plan.maxFeeds = 10;
      personalizedFeedsRepository.countByUserId.mockResolvedValue(11); // 11フィード（上限10）

      // Act & Assert
      await expect(
        service.checkFeedCreationLimits(
          mockUser,
          mockSubscription,
          mockPersonalizedFeedWithFilters,
        ),
      ).rejects.toThrow(PersonalizedFeedCreationLimitError);
    });

    it('タグ数が上限を超える場合、エラーを投げる', async () => {
      // Arrange
      mockSubscription.plan.maxTags = 5; // タグ数上限5
      const paramsWithTooManyTags = {
        ...mockPersonalizedFeedWithFilters,
        filterGroups: [
          {
            ...mockPersonalizedFeedWithFilters.filterGroups[0],
            tagFilters: [
              { tagName: 'JavaScript' },
              { tagName: 'TypeScript' },
              { tagName: 'React' },
              { tagName: 'Vue.js' },
              { tagName: 'Angular' },
              { tagName: 'Node.js' }, // 6タグ（上限5）
            ],
          },
        ],
      };

      // Act & Assert
      await expect(
        service.checkFeedCreationLimits(
          mockUser,
          mockSubscription,
          paramsWithTooManyTags,
        ),
      ).rejects.toThrow(PersonalizedFeedCreationLimitError);
    });

    it('著者数が上限を超える場合、エラーを投げる', async () => {
      // Arrange
      mockSubscription.plan.maxAuthors = 5; // 著者数上限5
      const paramsWithTooManyAuthors = {
        ...mockPersonalizedFeedWithFilters,
        filterGroups: [
          {
            ...mockPersonalizedFeedWithFilters.filterGroups[0],
            authorFilters: [
              { authorId: 'author1' },
              { authorId: 'author2' },
              { authorId: 'author3' },
              { authorId: 'author4' },
              { authorId: 'author5' },
              { authorId: 'author6' }, // 6著者（上限5）
            ],
          },
        ],
      };

      // Act & Assert
      await expect(
        service.checkFeedCreationLimits(
          mockUser,
          mockSubscription,
          paramsWithTooManyAuthors,
        ),
      ).rejects.toThrow(PersonalizedFeedCreationLimitError);
    });

    it('リポジトリの呼び出しでエラーが発生した場合、PersonalizedFeedErrorをスローする', async () => {
      // Arrange
      personalizedFeedsRepository.countByUserId.mockRejectedValue(
        new Error('Database error'),
      );

      // Act & Assert
      await expect(
        service.checkFeedCreationLimits(
          mockUser,
          mockSubscription,
          mockPersonalizedFeedWithFilters,
        ),
      ).rejects.toThrowError();
    });
  });
});
