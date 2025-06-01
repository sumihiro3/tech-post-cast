import { AppConfigService } from '@/app-config/app-config.service';
import { PersonalizedFeedsRepository } from '@/infrastructure/database/personalized-feeds/personalized-feeds.repository';
import { PersonalizedFeedFactory } from '@/test/factories/personalized-feed.factory';
import { PersonalizedProgramFactory } from '@/test/factories/personalized-program.factory';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  restoreLogOutput,
  suppressLogOutput,
} from '../../test/helpers/logger.helper';
import { IAppUsersRepository } from '../app-users/app-users.repository.interface';
import { IPersonalizedProgramsRepository } from '../personalized-programs/personalized-programs.repository.interface';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let personalizedFeedsRepository: jest.Mocked<PersonalizedFeedsRepository>;
  let personalizedProgramsRepository: jest.Mocked<IPersonalizedProgramsRepository>;
  let appUsersRepository: jest.Mocked<IAppUsersRepository>;
  let appConfigService: jest.Mocked<AppConfigService>;
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

    const mockAppUsersRepository = {
      findOneWithSubscription: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const mockAppConfigService = {
      FreePlanId: 'free-plan-id',
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
        {
          provide: 'AppUsersRepository',
          useValue: mockAppUsersRepository,
        },
        {
          provide: AppConfigService,
          useValue: mockAppConfigService,
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
    appUsersRepository = module.get(
      'AppUsersRepository',
    ) as jest.Mocked<IAppUsersRepository>;
    appConfigService = module.get(AppConfigService);
  });

  afterEach(() => {
    restoreLogOutput(logSpies);
  });

  describe('getPersonalizedPrograms', () => {
    it('パーソナルプログラム一覧を正しく取得できること', async () => {
      const userId = 'user-1';
      const query = { limit: 10, offset: 0 };

      // ユーザーの存在確認のモック
      const mockUser = { id: userId };
      appUsersRepository.findOne.mockResolvedValue(mockUser as any);

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

      expect(appUsersRepository.findOne).toHaveBeenCalledWith(userId);
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

      // ユーザーの存在確認のモック
      const mockUser = { id: userId };
      appUsersRepository.findOne.mockResolvedValue(mockUser as any);

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

      expect(appUsersRepository.findOne).toHaveBeenCalledWith(userId);
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

      // ユーザーの存在確認のモック
      const mockUser = { id: userId };
      appUsersRepository.findOne.mockResolvedValue(mockUser as any);

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
      expect(appUsersRepository.findOne).toHaveBeenCalledWith(userId);
    });

    it('番組が存在しない場合でも正常に動作すること', async () => {
      const userId = 'user-empty';
      const query = { limit: 10, offset: 0 };

      // ユーザーの存在確認のモック
      const mockUser = { id: userId };
      appUsersRepository.findOne.mockResolvedValue(mockUser as any);

      const mockProgramsResult = {
        programs: [],
        totalCount: 0,
      };

      personalizedProgramsRepository.findByUserIdWithPagination.mockResolvedValue(
        mockProgramsResult,
      );

      const result = await service.getPersonalizedPrograms(userId, query);

      expect(result).toBeDefined();
      expect(result.programs).toHaveLength(0);
      expect(result.totalCount).toBe(0);
      expect(result.hasNext).toBe(false);
      expect(appUsersRepository.findOne).toHaveBeenCalledWith(userId);
    });

    it('ユーザーが見つからない場合、NotFoundExceptionを投げること', async () => {
      const userId = 'non-existent-user';
      const query = { limit: 10, offset: 0 };

      // ユーザーが見つからない場合のモック
      appUsersRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getPersonalizedPrograms(userId, query),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.getPersonalizedPrograms(userId, query),
      ).rejects.toThrow(`User with ID ${userId} not found`);

      expect(appUsersRepository.findOne).toHaveBeenCalledWith(userId);
    });

    it('エラーが発生した場合は適切にハンドリングされること', async () => {
      const userId = 'user-1';
      const query = { limit: 10, offset: 0 };
      const error = new Error('Database connection failed');

      // ユーザー取得でエラーが発生する場合
      appUsersRepository.findOne.mockRejectedValue(error);

      await expect(
        service.getPersonalizedPrograms(userId, query),
      ).rejects.toThrow('Database connection failed');

      expect(appUsersRepository.findOne).toHaveBeenCalledWith(userId);
    });
  });

  describe('getDashboardStats', () => {
    beforeEach(() => {
      // 現在時刻を2025年1月15日に固定
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-01-15T12:00:00.000Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('統計情報を正しく取得できること', async () => {
      const userId = 'user-1';

      // ユーザーの存在確認のモック
      const mockUser = { id: userId };
      appUsersRepository.findOne.mockResolvedValue(mockUser as any);

      // モックデータの準備
      const mockFeeds = [
        PersonalizedFeedFactory.createPersonalizedFeedWithFilters({
          id: 'feed-1',
          isActive: true,
        }),
        PersonalizedFeedFactory.createPersonalizedFeedWithFilters({
          id: 'feed-2',
          isActive: true,
        }),
        PersonalizedFeedFactory.createPersonalizedFeedWithFilters({
          id: 'feed-3',
          isActive: false,
        }),
      ];

      const mockFeedsResult = {
        feeds: mockFeeds,
        total: 3,
      };

      const mockPrograms = [
        PersonalizedProgramFactory.createPersonalizedProgram({
          id: 'program-1',
          audioUrl: 'https://example.com/audio1.mp3',
          audioDuration: 300000, // 5分
          createdAt: new Date('2025-01-15'), // 今月
        }),
        PersonalizedProgramFactory.createPersonalizedProgram({
          id: 'program-2',
          audioUrl: 'https://example.com/audio2.mp3',
          audioDuration: 600000, // 10分
          createdAt: new Date('2025-01-20'), // 今月
        }),
        PersonalizedProgramFactory.createPersonalizedProgram({
          id: 'program-3',
          audioUrl: 'https://example.com/audio3.mp3',
          audioDuration: 900000, // 15分
          createdAt: new Date('2024-12-15'), // 先月
        }),
      ];

      const mockProgramsResult = {
        programs: mockPrograms,
        totalCount: 3,
      };

      // モックの設定
      personalizedFeedsRepository.findByUserIdWithFilters.mockResolvedValue(
        mockFeedsResult,
      );
      personalizedProgramsRepository.findByUserIdWithPagination.mockResolvedValue(
        mockProgramsResult,
      );

      // 実行
      const result = await service.getDashboardStats(userId);

      // 検証
      expect(result).toBeDefined();
      expect(result.activeFeedsCount).toBe(2); // アクティブなフィードは2つ
      expect(result.monthlyEpisodesCount).toBe(2); // 今月の番組は2つ
      expect(result.totalProgramDuration).toBe('30m'); // 総時間30分

      // リポジトリメソッドが正しく呼ばれたことを確認
      expect(appUsersRepository.findOne).toHaveBeenCalledWith(userId);
      expect(
        personalizedFeedsRepository.findByUserIdWithFilters,
      ).toHaveBeenCalledWith(userId, 1, 1000);
      expect(
        personalizedProgramsRepository.findByUserIdWithPagination,
      ).toHaveBeenCalledWith(userId, {
        limit: 1000,
        offset: 0,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('音声ファイルがない番組は総時間計算から除外されること', async () => {
      const userId = 'user-1';

      // ユーザーの存在確認のモック
      const mockUser = { id: userId };
      appUsersRepository.findOne.mockResolvedValue(mockUser as any);

      const mockFeeds = [
        PersonalizedFeedFactory.createPersonalizedFeedWithFilters({
          id: 'feed-1',
          isActive: true,
        }),
      ];

      const mockFeedsResult = {
        feeds: mockFeeds,
        total: 1,
      };

      const mockPrograms = [
        PersonalizedProgramFactory.createPersonalizedProgram({
          id: 'program-1',
          audioUrl: '', // 音声ファイルなし
          audioDuration: 300000,
          createdAt: new Date('2025-01-15'),
        }),
        PersonalizedProgramFactory.createPersonalizedProgram({
          id: 'program-2',
          audioUrl: 'https://example.com/audio2.mp3',
          audioDuration: 600000, // 10分
          createdAt: new Date('2025-01-15'),
        }),
      ];

      const mockProgramsResult = {
        programs: mockPrograms,
        totalCount: 2,
      };

      personalizedFeedsRepository.findByUserIdWithFilters.mockResolvedValue(
        mockFeedsResult,
      );
      personalizedProgramsRepository.findByUserIdWithPagination.mockResolvedValue(
        mockProgramsResult,
      );

      const result = await service.getDashboardStats(userId);

      expect(result.totalProgramDuration).toBe('10m'); // 音声ファイルがある番組のみカウント
      expect(appUsersRepository.findOne).toHaveBeenCalledWith(userId);
    });

    it('時間フォーマットが正しく動作すること', async () => {
      const userId = 'user-1';

      // ユーザーの存在確認のモック
      const mockUser = { id: userId };
      appUsersRepository.findOne.mockResolvedValue(mockUser as any);

      const mockFeedsResult = {
        feeds: [],
        total: 0,
      };

      const mockPrograms = [
        PersonalizedProgramFactory.createPersonalizedProgram({
          id: 'program-1',
          audioUrl: 'https://example.com/audio1.mp3',
          audioDuration: 3900000, // 65分 = 1時間5分
          createdAt: new Date('2025-01-15'),
        }),
      ];

      const mockProgramsResult = {
        programs: mockPrograms,
        totalCount: 1,
      };

      personalizedFeedsRepository.findByUserIdWithFilters.mockResolvedValue(
        mockFeedsResult,
      );
      personalizedProgramsRepository.findByUserIdWithPagination.mockResolvedValue(
        mockProgramsResult,
      );

      const result = await service.getDashboardStats(userId);

      expect(result.totalProgramDuration).toBe('1h'); // 1時間として表示
      expect(appUsersRepository.findOne).toHaveBeenCalledWith(userId);
    });

    it('フィードや番組が存在しない場合でも正常に動作すること', async () => {
      const userId = 'user-empty';

      // ユーザーの存在確認のモック
      const mockUser = { id: userId };
      appUsersRepository.findOne.mockResolvedValue(mockUser as any);

      const mockFeedsResult = {
        feeds: [],
        total: 0,
      };

      const mockProgramsResult = {
        programs: [],
        totalCount: 0,
      };

      personalizedFeedsRepository.findByUserIdWithFilters.mockResolvedValue(
        mockFeedsResult,
      );
      personalizedProgramsRepository.findByUserIdWithPagination.mockResolvedValue(
        mockProgramsResult,
      );

      const result = await service.getDashboardStats(userId);

      expect(result).toBeDefined();
      expect(result.activeFeedsCount).toBe(0);
      expect(result.monthlyEpisodesCount).toBe(0);
      expect(result.totalProgramDuration).toBe('0m');
      expect(appUsersRepository.findOne).toHaveBeenCalledWith(userId);
    });

    it('ユーザーが見つからない場合、NotFoundExceptionを投げること', async () => {
      const userId = 'non-existent-user';

      // ユーザーが見つからない場合のモック
      appUsersRepository.findOne.mockResolvedValue(null);

      await expect(service.getDashboardStats(userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getDashboardStats(userId)).rejects.toThrow(
        `User with ID ${userId} not found`,
      );

      expect(appUsersRepository.findOne).toHaveBeenCalledWith(userId);
    });

    it('エラーが発生した場合は適切にハンドリングされること', async () => {
      const userId = 'user-1';
      const error = new Error('Database error');

      // ユーザー取得でエラーが発生する場合
      appUsersRepository.findOne.mockRejectedValue(error);

      await expect(service.getDashboardStats(userId)).rejects.toThrow(
        'Database error',
      );

      expect(appUsersRepository.findOne).toHaveBeenCalledWith(userId);
    });
  });

  describe('getDashboardSubscription', () => {
    beforeEach(() => {
      // 現在時刻を2025年1月15日に固定
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-01-15T12:00:00.000Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('サブスクリプション情報を正しく取得できること', async () => {
      const userId = 'user-1';

      // ユーザーのサブスクリプション情報のモック（Freeプラン）
      const mockUserWithSubscription = {
        subscription: null, // Freeプランなのでサブスクリプションなし
      } as any;

      // モックデータの準備
      const mockFeeds = [
        PersonalizedFeedFactory.createPersonalizedFeedWithFilters({
          id: 'feed-1',
          isActive: true,
          filterGroups: [
            {
              id: 'group-1',
              filterId: 'filter-1',
              name: 'Group 1',
              logicType: 'AND',
              tagFilters: [
                {
                  id: 'tag-1',
                  groupId: 'group-1',
                  tagName: 'React',
                  createdAt: new Date(),
                },
                {
                  id: 'tag-2',
                  groupId: 'group-1',
                  tagName: 'TypeScript',
                  createdAt: new Date(),
                },
              ],
              authorFilters: [],
              dateRangeFilters: [],
              likesCountFilters: [],
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        }),
        PersonalizedFeedFactory.createPersonalizedFeedWithFilters({
          id: 'feed-2',
          isActive: true,
          filterGroups: [
            {
              id: 'group-2',
              filterId: 'filter-2',
              name: 'Group 2',
              logicType: 'OR',
              tagFilters: [
                {
                  id: 'tag-3',
                  groupId: 'group-2',
                  tagName: 'Vue',
                  createdAt: new Date(),
                },
              ],
              authorFilters: [],
              dateRangeFilters: [],
              likesCountFilters: [],
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        }),
        PersonalizedFeedFactory.createPersonalizedFeedWithFilters({
          id: 'feed-3',
          isActive: false, // 非アクティブ
          filterGroups: [],
        }),
      ];

      const mockFeedsResult = {
        feeds: mockFeeds,
        total: 3,
      };

      // モックの設定
      appUsersRepository.findOneWithSubscription.mockResolvedValue(
        mockUserWithSubscription,
      );
      personalizedFeedsRepository.findByUserIdWithFilters.mockResolvedValue(
        mockFeedsResult,
      );

      // テスト実行
      const result = await service.getDashboardSubscription(userId);

      // 検証
      expect(result).toEqual({
        planName: 'Free',
        planColor: 'grey',
        features: [
          { name: 'パーソナルフィード作成', available: true },
          { name: '日次配信', available: true },
          // 初期リリースでは以下の機能は実装しないため削除
          // { name: '週次配信', available: true },
          // { name: '月次配信', available: false },
          // { name: '高度なフィルタリング', available: false },
          // { name: 'API アクセス', available: false },
        ],
        usageItems: [
          {
            label: 'フィード数',
            current: 2, // アクティブなフィード数
            limit: 1,
            showPercentage: true,
            warningThreshold: 70,
            dangerThreshold: 90,
          },
          {
            label: 'タグ数',
            current: 3, // 全フィードのタグ数合計
            limit: 1,
            showPercentage: true,
            warningThreshold: 70,
            dangerThreshold: 90,
          },
        ],
        showUpgradeButton: true,
      });

      // モックが正しく呼ばれたことを確認
      expect(appUsersRepository.findOneWithSubscription).toHaveBeenCalledWith(
        userId,
      );
      expect(
        personalizedFeedsRepository.findByUserIdWithFilters,
      ).toHaveBeenCalledWith(userId, 1, 1000);
    });

    it('フィルターグループがない場合でもエラーにならないこと', async () => {
      const userId = 'user-3';

      // ユーザーのサブスクリプション情報のモック（サブスクリプションなし）
      const mockUserWithSubscription = {
        subscription: null,
      } as any;

      // モックデータの準備（フィルターグループなし）
      const mockFeeds = [
        PersonalizedFeedFactory.createPersonalizedFeedWithFilters({
          id: 'feed-1',
          isActive: true,
          filterGroups: [], // フィルターグループなし
        }),
      ];

      const mockFeedsResult = {
        feeds: mockFeeds,
        total: 1,
      };

      // モックの設定
      appUsersRepository.findOneWithSubscription.mockResolvedValue(
        mockUserWithSubscription,
      );
      personalizedFeedsRepository.findByUserIdWithFilters.mockResolvedValue(
        mockFeedsResult,
      );

      // テスト実行
      const result = await service.getDashboardSubscription(userId);

      // 検証（エラーが発生しないことを確認）
      expect(result).toBeDefined();
      expect(result.planName).toBe('Free');
      expect(result.usageItems[1].current).toBe(0); // タグ数は0
    });

    it('エラーが発生した場合は例外を再スローすること', async () => {
      const userId = 'user-error';
      const error = new Error('Database error');

      // モックの設定
      appUsersRepository.findOneWithSubscription.mockRejectedValue(error);

      // テスト実行と検証
      await expect(service.getDashboardSubscription(userId)).rejects.toThrow(
        'Database error',
      );

      // モックが正しく呼ばれたことを確認
      expect(appUsersRepository.findOneWithSubscription).toHaveBeenCalledWith(
        userId,
      );
    });

    it('ユーザーが見つからない場合、NotFoundExceptionを投げること', async () => {
      const userId = 'non-existent-user';

      // ユーザーが見つからない場合のモック
      appUsersRepository.findOneWithSubscription.mockResolvedValue(null);

      await expect(service.getDashboardSubscription(userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getDashboardSubscription(userId)).rejects.toThrow(
        `User with ID ${userId} not found`,
      );

      expect(appUsersRepository.findOneWithSubscription).toHaveBeenCalledWith(
        userId,
      );
    });

    it('有料プランのサブスクリプション情報を正しく取得できること', async () => {
      const userId = 'user-2';

      // ユーザーのサブスクリプション情報のモック（Basicプラン）
      const mockUserWithSubscription = {
        subscription: {
          plan: {
            name: 'Basic',
            maxFeeds: 5,
            maxTags: 20,
          },
        },
      } as any;

      // モックデータの準備（フィードなし）
      const mockFeedsResult = {
        feeds: [],
        total: 0,
      };

      // モックの設定
      appUsersRepository.findOneWithSubscription.mockResolvedValue(
        mockUserWithSubscription,
      );
      personalizedFeedsRepository.findByUserIdWithFilters.mockResolvedValue(
        mockFeedsResult,
      );

      // テスト実行
      const result = await service.getDashboardSubscription(userId);

      // 検証
      expect(result).toEqual({
        planName: 'Basic',
        planColor: 'blue',
        features: [
          { name: 'パーソナルフィード作成', available: true },
          { name: '日次配信', available: true },
        ],
        usageItems: [
          {
            label: 'フィード数',
            current: 0,
            limit: 5,
            showPercentage: true,
            warningThreshold: 70,
            dangerThreshold: 90,
          },
          {
            label: 'タグ数',
            current: 0,
            limit: 20,
            showPercentage: true,
            warningThreshold: 70,
            dangerThreshold: 90,
          },
        ],
        showUpgradeButton: false, // 有料プランなのでアップグレードボタンは非表示
      });

      // モックが正しく呼ばれたことを確認
      expect(appUsersRepository.findOneWithSubscription).toHaveBeenCalledWith(
        userId,
      );
      expect(
        personalizedFeedsRepository.findByUserIdWithFilters,
      ).toHaveBeenCalledWith(userId, 1, 1000);
    });

    it('ユーザー情報取得でエラーが発生した場合、エラーを再スローすること', async () => {
      const userId = 'user-error';
      const error = new Error('Database connection failed');

      // モックの設定
      appUsersRepository.findOneWithSubscription.mockRejectedValue(error);

      // テスト実行と検証
      await expect(service.getDashboardSubscription(userId)).rejects.toThrow(
        'Database connection failed',
      );

      // モックが正しく呼ばれたことを確認
      expect(appUsersRepository.findOneWithSubscription).toHaveBeenCalledWith(
        userId,
      );
    });
  });
});
