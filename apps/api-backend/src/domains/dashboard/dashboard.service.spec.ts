import { AppConfigService } from '@/app-config/app-config.service';
import { PersonalizedFeedsRepository } from '@/infrastructure/database/personalized-feeds/personalized-feeds.repository';
import { AppUserFactory } from '@/test/factories/app-user.factory';
import { PersonalizedFeedFactory } from '@/test/factories/personalized-feed.factory';
import { PersonalizedProgramFactory } from '@/test/factories/personalized-program.factory';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  restoreLogOutput,
  suppressLogOutput,
} from '../../test/helpers/logger.helper';
import { IAppUsersRepository } from '../app-users/app-users.repository.interface';
import { IPersonalizedProgramAttemptsRepository } from '../personalized-program-attempts/personalized-program-attempts.repository.interface';
import { IPersonalizedProgramsRepository } from '../personalized-programs/personalized-programs.repository.interface';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let personalizedFeedsRepository: jest.Mocked<PersonalizedFeedsRepository>;
  let personalizedProgramsRepository: jest.Mocked<IPersonalizedProgramsRepository>;
  let appUsersRepository: jest.Mocked<IAppUsersRepository>;
  let appConfigService: jest.Mocked<AppConfigService>;
  let logSpies: jest.SpyInstance[];
  let personalizedProgramAttemptsRepository: jest.Mocked<IPersonalizedProgramAttemptsRepository>;

  beforeEach(async () => {
    logSpies = suppressLogOutput();

    const mockPersonalizedFeedsRepository = {
      findByUserIdWithFilters: jest.fn(),
      findById: jest.fn(),
    };

    const mockPersonalizedProgramsRepository = {
      findByUserIdWithPagination: jest.fn(),
      findById: jest.fn(),
      findAllByUserIdForStats: jest.fn(),
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

    const mockPersonalizedProgramAttemptsRepository = {
      findByUserIdWithRelationsForDashboard: jest.fn(),
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
        {
          provide: 'PersonalizedProgramAttemptsRepository',
          useValue: mockPersonalizedProgramAttemptsRepository,
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
    personalizedProgramAttemptsRepository = module.get(
      'PersonalizedProgramAttemptsRepository',
    ) as jest.Mocked<IPersonalizedProgramAttemptsRepository>;
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
      personalizedProgramsRepository.findAllByUserIdForStats.mockResolvedValue(
        mockProgramsResult,
      );

      // 実行
      const result = await service.getDashboardStats(userId);

      // 検証
      expect(result).toBeDefined();
      expect(result.activeFeedsCount).toBe(2); // アクティブなフィードは2つ
      expect(result.totalEpisodesCount).toBe(3); // 総番組数は3つ（有効期限切れも含む）
      expect(result.totalProgramDuration).toBe('30m'); // 総時間30分

      // リポジトリメソッドが正しく呼ばれたことを確認
      expect(appUsersRepository.findOne).toHaveBeenCalledWith(userId);
      expect(
        personalizedFeedsRepository.findByUserIdWithFilters,
      ).toHaveBeenCalledWith(userId, 1, 1000);
      expect(
        personalizedProgramsRepository.findAllByUserIdForStats,
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
      personalizedProgramsRepository.findAllByUserIdForStats.mockResolvedValue(
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
      personalizedProgramsRepository.findAllByUserIdForStats.mockResolvedValue(
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
      personalizedProgramsRepository.findAllByUserIdForStats.mockResolvedValue(
        mockProgramsResult,
      );

      const result = await service.getDashboardStats(userId);

      expect(result).toBeDefined();
      expect(result.activeFeedsCount).toBe(0);
      expect(result.totalEpisodesCount).toBe(0);
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

  describe('getPersonalizedProgramDetail', () => {
    it('パーソナルプログラムの詳細情報を正常に取得できること', async () => {
      const userId = 'user-1';
      const programId = 'program-1';
      const mockUser = AppUserFactory.createAppUser({ id: userId });
      const mockProgram = PersonalizedProgramFactory.createPersonalizedProgram({
        id: programId,
        userId,
        title: 'テストプログラム詳細',
        script: {
          opening: 'こんにちは、今週の記事をお届けします。',
          sections: [
            {
              title: 'React 18の新機能',
              content: 'React 18で追加された新機能について...',
            },
          ],
          closing: '以上、今週の記事でした。',
        },
        chapters: [
          {
            title: 'オープニング',
            startTime: 0,
            endTime: 30,
          },
          {
            title: 'メインコンテンツ',
            startTime: 30,
            endTime: 150,
          },
        ],
      });

      appUsersRepository.findOne.mockResolvedValue(mockUser);
      personalizedProgramsRepository.findById.mockResolvedValue(mockProgram);

      const result = await service.getPersonalizedProgramDetail(
        userId,
        programId,
      );

      expect(result).toBeDefined();
      expect(result.id).toBe(programId);
      expect(result.title).toBe('テストプログラム詳細');
      expect(result.feedId).toBe('feed-1');
      expect(result.feedName).toBe('テストフィード1');
      expect(result.dataSource).toBe('qiita');
      expect(result.script).toEqual({
        opening: 'こんにちは、今週の記事をお届けします。',
        sections: [
          {
            title: 'React 18の新機能',
            content: 'React 18で追加された新機能について...',
          },
        ],
        closing: '以上、今週の記事でした。',
      });
      expect(result.chapters).toHaveLength(2);
      expect(result.chapters[0]).toEqual({
        title: 'オープニング',
        startTime: 0,
        endTime: 30,
      });
      expect(result.posts).toHaveLength(1);
      expect(result.posts[0].id).toBe('post-1');
      expect(result.posts[0].title).toBe('テスト記事1');

      expect(appUsersRepository.findOne).toHaveBeenCalledWith(userId);
      expect(personalizedProgramsRepository.findById).toHaveBeenCalledWith(
        programId,
      );
    });

    it('ユーザーが存在しない場合、NotFoundExceptionをスローすること', async () => {
      const userId = 'non-existent-user';
      const programId = 'program-1';

      appUsersRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getPersonalizedProgramDetail(userId, programId),
      ).rejects.toThrow(NotFoundException);

      expect(appUsersRepository.findOne).toHaveBeenCalledWith(userId);
      expect(personalizedProgramsRepository.findById).not.toHaveBeenCalled();
    });

    it('プログラムが存在しない場合、NotFoundExceptionをスローすること', async () => {
      const userId = 'user-1';
      const programId = 'non-existent-program';
      const mockUser = AppUserFactory.createAppUser({ id: userId });

      appUsersRepository.findOne.mockResolvedValue(mockUser);
      personalizedProgramsRepository.findById.mockResolvedValue(null);

      await expect(
        service.getPersonalizedProgramDetail(userId, programId),
      ).rejects.toThrow(NotFoundException);

      expect(appUsersRepository.findOne).toHaveBeenCalledWith(userId);
      expect(personalizedProgramsRepository.findById).toHaveBeenCalledWith(
        programId,
      );
    });

    it('プログラムの所有者が異なる場合、NotFoundExceptionをスローすること', async () => {
      const userId = 'user-1';
      const programId = 'program-1';
      const mockUser = AppUserFactory.createAppUser({ id: userId });
      const mockProgram = PersonalizedProgramFactory.createPersonalizedProgram({
        id: programId,
        userId: 'other-user', // 異なるユーザーID
      });

      appUsersRepository.findOne.mockResolvedValue(mockUser);
      personalizedProgramsRepository.findById.mockResolvedValue(mockProgram);

      await expect(
        service.getPersonalizedProgramDetail(userId, programId),
      ).rejects.toThrow(NotFoundException);

      expect(appUsersRepository.findOne).toHaveBeenCalledWith(userId);
      expect(personalizedProgramsRepository.findById).toHaveBeenCalledWith(
        programId,
      );
    });

    it('チャプター情報が空の場合、空配列を返すこと', async () => {
      const userId = 'user-1';
      const programId = 'program-1';
      const mockUser = AppUserFactory.createAppUser({ id: userId });
      const mockProgram = PersonalizedProgramFactory.createPersonalizedProgram({
        id: programId,
        userId,
        chapters: [], // 空のチャプター
      });

      appUsersRepository.findOne.mockResolvedValue(mockUser);
      personalizedProgramsRepository.findById.mockResolvedValue(mockProgram);

      const result = await service.getPersonalizedProgramDetail(
        userId,
        programId,
      );

      expect(result.chapters).toEqual([]);
    });

    it('チャプター情報がnullの場合、空配列を返すこと', async () => {
      const userId = 'user-1';
      const programId = 'program-1';
      const mockUser = AppUserFactory.createAppUser({ id: userId });
      const mockProgram = PersonalizedProgramFactory.createPersonalizedProgram({
        id: programId,
        userId,
        chapters: null, // nullのチャプター
      });

      appUsersRepository.findOne.mockResolvedValue(mockUser);
      personalizedProgramsRepository.findById.mockResolvedValue(mockProgram);

      const result = await service.getPersonalizedProgramDetail(
        userId,
        programId,
      );

      expect(result.chapters).toEqual([]);
    });

    it('非アクティブフィードの番組詳細へのアクセスを拒否すること', async () => {
      const userId = 'user-1';
      const programId = 'program-1';

      // ユーザーの存在確認のモック
      const mockUser = AppUserFactory.createAppUser({ id: userId });
      appUsersRepository.findOne.mockResolvedValue(mockUser);

      // 非アクティブフィードの番組のモック
      const mockProgram = PersonalizedProgramFactory.createPersonalizedProgram({
        id: programId,
        userId,
        feedId: 'feed-1',
        feed: {
          id: 'feed-1',
          name: 'Test Feed',
          dataSource: 'qiita',
          isActive: false, // 非アクティブフィード
        },
      });
      personalizedProgramsRepository.findById.mockResolvedValue(mockProgram);

      await expect(
        service.getPersonalizedProgramDetail(userId, programId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.getPersonalizedProgramDetail(userId, programId),
      ).rejects.toThrow(`Program with ID ${programId} not found`);

      expect(personalizedProgramsRepository.findById).toHaveBeenCalledWith(
        programId,
      );
    });

    it('アクティブフィードの番組詳細を正常に取得できること', async () => {
      const userId = 'user-1';
      const programId = 'program-1';

      // ユーザーの存在確認のモック
      const mockUser = AppUserFactory.createAppUser({ id: userId });
      appUsersRepository.findOne.mockResolvedValue(mockUser);

      // アクティブフィードの番組のモック
      const mockProgram = PersonalizedProgramFactory.createPersonalizedProgram({
        id: programId,
        userId,
        feedId: 'feed-1',
        feed: {
          id: 'feed-1',
          name: 'Test Feed',
          dataSource: 'qiita',
          isActive: true, // アクティブフィード
        },
      });
      personalizedProgramsRepository.findById.mockResolvedValue(mockProgram);

      const result = await service.getPersonalizedProgramDetail(
        userId,
        programId,
      );

      expect(result).toBeDefined();
      expect(result.id).toBe(programId);
      expect(result.feedId).toBe('feed-1');
      expect(result.feedName).toBe('Test Feed');
      expect(personalizedProgramsRepository.findById).toHaveBeenCalledWith(
        programId,
      );
    });
  });

  describe('getProgramGenerationHistory', () => {
    it('番組生成履歴を正常に取得できること', async () => {
      const userId = 'user-1';
      const query = { limit: 20, offset: 0 };

      // ユーザーの存在確認のモック
      const mockUser = AppUserFactory.createAppUser({ id: userId });
      appUsersRepository.findOne.mockResolvedValue(mockUser);

      // 番組生成履歴のモック
      const mockAttemptsResult = {
        attempts: [
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
        ],
        totalCount: 2,
      };

      personalizedProgramAttemptsRepository.findByUserIdWithRelationsForDashboard.mockResolvedValue(
        mockAttemptsResult,
      );

      const result = await service.getProgramGenerationHistory(userId, query);

      expect(result).toBeDefined();
      expect(result.history).toHaveLength(2);
      expect(result.history[0].id).toBe('attempt-1');
      expect(result.history[0].status).toBe('SUCCESS');
      expect(result.history[0].feed.id).toBe('feed-1');
      expect(result.history[0].feed.name).toBe('テストフィード1');
      expect(result.history[0].program).toEqual({
        id: 'program-1',
        title: 'テスト番組1',
        expiresAt: new Date('2024-02-01'),
        isExpired: false,
      });
      expect(result.history[1].id).toBe('attempt-2');
      expect(result.history[1].status).toBe('FAILED');
      expect(result.history[1].reason).toBe('NOT_ENOUGH_POSTS');
      expect(result.history[1].program).toBeNull();
      expect(result.totalCount).toBe(2);
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(0);
      expect(result.hasNext).toBe(false);

      expect(appUsersRepository.findOne).toHaveBeenCalledWith(userId);
      expect(
        personalizedProgramAttemptsRepository.findByUserIdWithRelationsForDashboard,
      ).toHaveBeenCalledWith(userId, undefined, {
        limit: 20,
        offset: 0,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('feedIdが指定された場合、フィードの所有者確認を行うこと', async () => {
      const userId = 'user-1';
      const feedId = 'feed-1';
      const query = { feedId, limit: 20, offset: 0 };

      // ユーザーの存在確認のモック
      const mockUser = AppUserFactory.createAppUser({ id: userId });
      appUsersRepository.findOne.mockResolvedValue(mockUser);

      // フィードの存在確認と所有者確認のモック
      const mockFeed =
        PersonalizedFeedFactory.createPersonalizedFeedWithFilters({
          id: feedId,
          userId,
        });
      personalizedFeedsRepository.findById.mockResolvedValue(mockFeed);

      // 番組生成履歴のモック
      const mockAttemptsResult = {
        attempts: [
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
        ],
        totalCount: 1,
      };

      personalizedProgramAttemptsRepository.findByUserIdWithRelationsForDashboard.mockResolvedValue(
        mockAttemptsResult,
      );

      const result = await service.getProgramGenerationHistory(userId, query);

      expect(result).toBeDefined();
      expect(result.history).toHaveLength(1);
      expect(result.totalCount).toBe(1);

      expect(appUsersRepository.findOne).toHaveBeenCalledWith(userId);
      expect(personalizedFeedsRepository.findById).toHaveBeenCalledWith(feedId);
      expect(
        personalizedProgramAttemptsRepository.findByUserIdWithRelationsForDashboard,
      ).toHaveBeenCalledWith(userId, feedId, {
        limit: 20,
        offset: 0,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('デフォルトのページネーション値を使用すること', async () => {
      const userId = 'user-1';
      const query = {}; // limit, offsetを指定しない

      // ユーザーの存在確認のモック
      const mockUser = AppUserFactory.createAppUser({ id: userId });
      appUsersRepository.findOne.mockResolvedValue(mockUser);

      const mockAttemptsResult = {
        attempts: [],
        totalCount: 0,
      };

      personalizedProgramAttemptsRepository.findByUserIdWithRelationsForDashboard.mockResolvedValue(
        mockAttemptsResult,
      );

      const result = await service.getProgramGenerationHistory(userId, query);

      expect(result).toBeDefined();
      expect(result.limit).toBe(20); // デフォルト値
      expect(result.offset).toBe(0); // デフォルト値
      expect(result.hasNext).toBe(false);

      expect(
        personalizedProgramAttemptsRepository.findByUserIdWithRelationsForDashboard,
      ).toHaveBeenCalledWith(userId, undefined, {
        limit: 20,
        offset: 0,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('hasNextフラグを正しく計算すること', async () => {
      const userId = 'user-1';
      const query = { limit: 5, offset: 0 };

      // ユーザーの存在確認のモック
      const mockUser = AppUserFactory.createAppUser({ id: userId });
      appUsersRepository.findOne.mockResolvedValue(mockUser);

      const mockAttemptsResult = {
        attempts: [
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
            status: 'SUCCESS',
            reason: null,
            postCount: 2,
            createdAt: new Date('2024-01-02'),
            feed: {
              id: 'feed-2',
              name: 'テストフィード2',
            },
            program: {
              id: 'program-2',
              title: 'テスト番組2',
              expiresAt: new Date('2024-02-02'),
              isExpired: false,
            },
          },
          {
            id: 'attempt-3',
            userId: 'user-1',
            status: 'FAILED',
            reason: 'NOT_ENOUGH_POSTS',
            postCount: 1,
            createdAt: new Date('2024-01-03'),
            feed: {
              id: 'feed-3',
              name: 'テストフィード3',
            },
            program: null,
          },
          {
            id: 'attempt-4',
            userId: 'user-1',
            status: 'SKIPPED',
            reason: 'NO_NEW_POSTS',
            postCount: 0,
            createdAt: new Date('2024-01-04'),
            feed: {
              id: 'feed-4',
              name: 'テストフィード4',
            },
            program: null,
          },
          {
            id: 'attempt-5',
            userId: 'user-1',
            status: 'SUCCESS',
            reason: null,
            postCount: 4,
            createdAt: new Date('2024-01-05'),
            feed: {
              id: 'feed-5',
              name: 'テストフィード5',
            },
            program: {
              id: 'program-5',
              title: 'テスト番組5',
              expiresAt: new Date('2024-02-05'),
              isExpired: false,
            },
          },
        ],
        totalCount: 12, // 5 + 0 < 12 なので hasNext = true
      };

      personalizedProgramAttemptsRepository.findByUserIdWithRelationsForDashboard.mockResolvedValue(
        mockAttemptsResult,
      );

      const result = await service.getProgramGenerationHistory(userId, query);

      expect(result.hasNext).toBe(true);
      expect(result.totalCount).toBe(12);
    });

    it('履歴が存在しない場合でも正常に動作すること', async () => {
      const userId = 'user-empty';
      const query = { limit: 20, offset: 0 };

      // ユーザーの存在確認のモック
      const mockUser = AppUserFactory.createAppUser({ id: userId });
      appUsersRepository.findOne.mockResolvedValue(mockUser);

      const mockAttemptsResult = {
        attempts: [],
        totalCount: 0,
      };

      personalizedProgramAttemptsRepository.findByUserIdWithRelationsForDashboard.mockResolvedValue(
        mockAttemptsResult,
      );

      const result = await service.getProgramGenerationHistory(userId, query);

      expect(result).toBeDefined();
      expect(result.history).toHaveLength(0);
      expect(result.totalCount).toBe(0);
      expect(result.hasNext).toBe(false);
    });

    it('ユーザーが存在しない場合、NotFoundExceptionを投げること', async () => {
      const userId = 'non-existent-user';
      const query = { limit: 20, offset: 0 };

      appUsersRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getProgramGenerationHistory(userId, query),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.getProgramGenerationHistory(userId, query),
      ).rejects.toThrow(`User with ID ${userId} not found`);

      expect(appUsersRepository.findOne).toHaveBeenCalledWith(userId);
    });

    it('指定されたfeedIdが存在しない場合、NotFoundExceptionを投げること', async () => {
      const userId = 'user-1';
      const feedId = 'non-existent-feed';
      const query = { feedId, limit: 20, offset: 0 };

      // ユーザーの存在確認のモック
      const mockUser = AppUserFactory.createAppUser({ id: userId });
      appUsersRepository.findOne.mockResolvedValue(mockUser);

      // フィードが存在しない場合のモック
      personalizedFeedsRepository.findById.mockResolvedValue(null);

      await expect(
        service.getProgramGenerationHistory(userId, query),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.getProgramGenerationHistory(userId, query),
      ).rejects.toThrow(`パーソナルフィード [${feedId}] が見つかりません`);

      expect(personalizedFeedsRepository.findById).toHaveBeenCalledWith(feedId);
    });

    it('指定されたfeedIdが他のユーザーの所有である場合、NotFoundExceptionを投げること', async () => {
      const userId = 'user-1';
      const feedId = 'feed-1';
      const query = { feedId, limit: 20, offset: 0 };

      // ユーザーの存在確認のモック
      const mockUser = AppUserFactory.createAppUser({ id: userId });
      appUsersRepository.findOne.mockResolvedValue(mockUser);

      // 他のユーザーが所有するフィードのモック
      const mockFeed =
        PersonalizedFeedFactory.createPersonalizedFeedWithFilters({
          id: feedId,
          userId: 'other-user', // 異なるユーザーID
        });
      personalizedFeedsRepository.findById.mockResolvedValue(mockFeed);

      await expect(
        service.getProgramGenerationHistory(userId, query),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.getProgramGenerationHistory(userId, query),
      ).rejects.toThrow(
        `ユーザー [${userId}] は、パーソナルフィード [${feedId}] を所有していません`,
      );

      expect(personalizedFeedsRepository.findById).toHaveBeenCalledWith(feedId);
    });
  });
});
