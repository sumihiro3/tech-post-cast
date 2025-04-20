import { IAppUserRepository } from '@/domains/app-user/app-user.repository.interface';
import { UserNotFoundError } from '@/types/errors';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  PersonalizedFeed,
  PersonalizedFeedWithFilters,
} from './personalized-feeds.entity';
import { IPersonalizedFeedsRepository } from './personalized-feeds.repository.interface';
import { PersonalizedFeedsService } from './personalized-feeds.service';

describe('PersonalizedFeedsService', () => {
  let service: PersonalizedFeedsService;
  let personalizedFeedsRepository: jest.Mocked<IPersonalizedFeedsRepository>;
  let appUserRepository: jest.Mocked<IAppUserRepository>;

  const mockUser = {
    id: 'user_123456',
    firstName: 'テスト', // 追加
    lastName: 'ユーザー', // 追加
    email: 'test@example.com',
    imageUrl: 'https://example.com/image.jpg', // 追加
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignInAt: new Date(), // 追加
  };

  const mockPersonalizedFeed = {
    id: 'feed_123456',
    userId: 'user_123456',
    name: 'テスト用フィード',
    dataSource: 'qiita',
    filterConfig: { minLikes: 5 },
    deliveryConfig: { frequency: 'daily', time: '08:00' },
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
    } as unknown as jest.Mocked<IPersonalizedFeedsRepository>;

    appUserRepository = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<IAppUserRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PersonalizedFeedsService,
        {
          provide: 'IPersonalizedFeedsRepository',
          useValue: personalizedFeedsRepository,
        },
        {
          provide: 'IAppUserRepository',
          useValue: appUserRepository,
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

      const filterGroupDto = {
        name: 'テスト用フィルターグループ',
        logicType: 'OR',
        tagFilters: [],
        authorFilters: [],
        dateRangeFilters: [{ daysAgo: 30 }],
      };

      const result = await service.create(
        'user_123456',
        'テスト用フィード',
        'qiita',
        { minLikes: 5 },
        { frequency: 'daily', time: '08:00' },
        true,
        [filterGroupDto],
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
    });

    it('ユーザーが存在しない場合はエラーになること', async () => {
      appUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create(
          'nonexistent_user',
          'テスト用フィード',
          'qiita',
          {},
          {},
          true,
          [],
        ),
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

      const result = await service.update(
        'feed_123456',
        'user_123456',
        { name: '更新されたフィード名' },
        [filterGroupDto],
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

      await expect(
        service.update(
          'nonexistent_feed',
          'user_123456',
          { name: '更新されたフィード名' },
          [],
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
