import { Test, TestingModule } from '@nestjs/testing';
import { PersonalizedFeedsRepository } from '../../infrastructure/database/personalized-feeds/personalized-feeds.repository';
import { PersonalizedFeedFactory } from '../../test/factories/personalized-feed.factory';
import { PersonalizedProgramFactory } from '../../test/factories/personalized-program.factory';
import {
  restoreLogOutput,
  suppressLogOutput,
} from '../../test/helpers/logger.helper';
import { IPersonalizedProgramsRepository } from '../personalized-programs/personalized-programs.repository.interface';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let personalizedFeedsRepository: jest.Mocked<PersonalizedFeedsRepository>;
  let personalizedProgramsRepository: jest.Mocked<IPersonalizedProgramsRepository>;
  let logSpies: jest.SpyInstance[];

  beforeEach(async () => {
    logSpies = suppressLogOutput();

    const mockPersonalizedFeedsRepository = {
      findByUserIdWithFilters: jest.fn(),
    };

    const mockPersonalizedProgramsRepository = {
      findByUserIdWithPagination: jest.fn(),
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: PersonalizedFeedsRepository,
          useValue: mockPersonalizedFeedsRepository,
        },
        {
          provide: 'PersonalizedProgramsRepository',
          useValue: mockPersonalizedProgramsRepository,
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    personalizedFeedsRepository = module.get(
      PersonalizedFeedsRepository,
    ) as jest.Mocked<PersonalizedFeedsRepository>;
    personalizedProgramsRepository = module.get(
      'PersonalizedProgramsRepository',
    ) as jest.Mocked<IPersonalizedProgramsRepository>;
  });

  afterEach(() => {
    restoreLogOutput(logSpies);
  });

  describe('getPersonalizedFeedsSummary', () => {
    it('パーソナルフィード概要情報を正しく取得できること', async () => {
      const userId = 'user-1';
      const mockFeedsResult = {
        feeds: [
          PersonalizedFeedFactory.createPersonalizedFeedWithFilters({
            id: 'feed-1',
            name: 'テストフィード1',
            isActive: true,
            createdAt: new Date('2025-01-01'),
            updatedAt: new Date('2025-01-01'),
          }),
          PersonalizedFeedFactory.createPersonalizedFeedWithFilters({
            id: 'feed-2',
            name: 'テストフィード2',
            isActive: false,
            createdAt: new Date('2025-01-02'),
            updatedAt: new Date('2025-01-02'),
            filterGroups: [
              {
                id: 'group-2',
                filterId: 'feed-2',
                name: 'グループ2',
                logicType: 'OR' as const,
                createdAt: new Date('2025-01-02'),
                updatedAt: new Date('2025-01-02'),
                tagFilters: [
                  {
                    id: 'tag-2',
                    groupId: 'group-2',
                    tagName: 'typescript',
                    createdAt: new Date('2025-01-02'),
                  },
                ],
                authorFilters: [],
                dateRangeFilters: [],
                likesCountFilters: [],
              },
            ],
          }),
        ],
        total: 2,
      };

      personalizedFeedsRepository.findByUserIdWithFilters.mockResolvedValue(
        mockFeedsResult,
      );

      const result = await service.getPersonalizedFeedsSummary(userId);

      expect(result).toBeDefined();
      expect(result.activeFeedsCount).toBe(1);
      expect(result.totalFeedsCount).toBe(2);
      expect(result.recentFeeds).toHaveLength(2);
      expect(result.recentFeeds[0].id).toBe('feed-2'); // 最新順
      expect(result.recentFeeds[0].name).toBe('テストフィード2');
      expect(result.recentFeeds[0].tagFiltersCount).toBe(1);
      expect(result.recentFeeds[0].totalFiltersCount).toBe(1);
      expect(result.recentFeeds[1].id).toBe('feed-1');
      expect(result.recentFeeds[1].tagFiltersCount).toBe(1);
      expect(result.recentFeeds[1].authorFiltersCount).toBe(1);
      expect(result.recentFeeds[1].totalFiltersCount).toBe(4);
      expect(result.totalFiltersCount).toBe(5); // 全フィードの合計

      expect(
        personalizedFeedsRepository.findByUserIdWithFilters,
      ).toHaveBeenCalledWith(userId, 1, 1000);
    });

    it('フィードが存在しない場合、適切なデフォルト値を返すこと', async () => {
      const userId = 'user-1';
      const mockFeedsResult = {
        feeds: [],
        total: 0,
      };

      personalizedFeedsRepository.findByUserIdWithFilters.mockResolvedValue(
        mockFeedsResult,
      );

      const result = await service.getPersonalizedFeedsSummary(userId);

      expect(result).toBeDefined();
      expect(result.activeFeedsCount).toBe(0);
      expect(result.totalFeedsCount).toBe(0);
      expect(result.recentFeeds).toHaveLength(0);
      expect(result.totalFiltersCount).toBe(0);
    });
  });

  describe('getPersonalizedPrograms', () => {
    it('パーソナルプログラム一覧を正しく取得できること', async () => {
      const userId = 'user-1';
      const query = { limit: 10, offset: 0 };
      const mockProgramsResult = {
        programs: [
          PersonalizedProgramFactory.createPersonalizedProgram({
            createdAt: new Date('2025-01-01'),
            updatedAt: new Date('2025-01-01'),
          }),
        ],
        totalCount: 1,
      };

      personalizedProgramsRepository.findByUserIdWithPagination.mockResolvedValue(
        mockProgramsResult,
      );

      const result = await service.getPersonalizedPrograms(userId, query);

      expect(result).toBeDefined();
      expect(result.programs).toHaveLength(1);
      expect(result.programs[0].id).toBe('program-1');
      expect(result.programs[0].title).toBe('テストプログラム1');
      expect(result.programs[0].feedName).toBe('テストフィード1');
      expect(result.programs[0].postsCount).toBe(1);
      expect(result.totalCount).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(0);
      expect(result.hasNext).toBe(false);

      expect(
        personalizedProgramsRepository.findByUserIdWithPagination,
      ).toHaveBeenCalledWith(userId, {
        limit: 10,
        offset: 0,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('デフォルトのページネーション値を使用すること', async () => {
      const userId = 'user-1';
      const query = {}; // limit, offsetを指定しない
      const mockProgramsResult = {
        programs: [],
        totalCount: 0,
      };

      personalizedProgramsRepository.findByUserIdWithPagination.mockResolvedValue(
        mockProgramsResult,
      );

      const result = await service.getPersonalizedPrograms(userId, query);

      expect(result).toBeDefined();
      expect(result.limit).toBe(10); // デフォルト値
      expect(result.offset).toBe(0); // デフォルト値
      expect(result.hasNext).toBe(false);

      expect(
        personalizedProgramsRepository.findByUserIdWithPagination,
      ).toHaveBeenCalledWith(userId, {
        limit: 10,
        offset: 0,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('hasNextフラグを正しく計算すること', async () => {
      const userId = 'user-1';
      const query = { limit: 5, offset: 0 };
      const mockProgramsResult = {
        programs: PersonalizedProgramFactory.createPersonalizedPrograms(5, {
          posts: [], // 記事なしのプログラム
        }),
        totalCount: 12, // 5 + 0 < 12 なので hasNext = true
      };

      personalizedProgramsRepository.findByUserIdWithPagination.mockResolvedValue(
        mockProgramsResult,
      );

      const result = await service.getPersonalizedPrograms(userId, query);

      expect(result.hasNext).toBe(true);
      expect(result.totalCount).toBe(12);
    });
  });
});
