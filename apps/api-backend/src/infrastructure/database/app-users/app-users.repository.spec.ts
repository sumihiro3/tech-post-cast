import { AppConfigService } from '@/app-config/app-config.service';
import { AppUserFindError } from '@/types/errors/app-user.error';
import { addDays } from '@tech-post-cast/commons';
import { PrismaClientManager } from '@tech-post-cast/database';
import {
  restoreLogOutput,
  suppressLogOutput,
} from '../../../test/helpers/logger.helper';
import { createTestingModule } from '../../../test/helpers/test-module.helper';
import { AppUsersRepository } from './app-users.repository';

describe('AppUsersRepository', () => {
  let repository: AppUsersRepository;
  let prismaClientManager: jest.Mocked<PrismaClientManager>;
  let appConfigService: jest.Mocked<AppConfigService>;
  let logSpies: jest.SpyInstance[];
  let mockPrismaClient: any;

  beforeEach(async () => {
    logSpies = suppressLogOutput();

    mockPrismaClient = {
      appUser: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      subscription: {
        create: jest.fn(),
      },
    };

    prismaClientManager = {
      getClient: jest.fn().mockReturnValue(mockPrismaClient),
      transaction: jest.fn().mockImplementation(async (callback) => {
        return await callback();
      }),
    } as unknown as jest.Mocked<PrismaClientManager>;

    appConfigService = {
      FreePlanId: 'free-plan-id',
    } as unknown as jest.Mocked<AppConfigService>;

    const module = await createTestingModule({
      providers: [
        AppUsersRepository,
        {
          provide: PrismaClientManager,
          useValue: prismaClientManager,
        },
        {
          provide: AppConfigService,
          useValue: appConfigService,
        },
      ],
    });

    repository = module.get<AppUsersRepository>(AppUsersRepository);
  });

  afterEach(() => {
    restoreLogOutput(logSpies);
  });

  describe('findOne', () => {
    it('指定したIDのユーザーを取得できること', async () => {
      const userId = 'user-1';
      const mockUser = {
        id: userId,
        email: 'user@example.com',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaClient.appUser.findUnique.mockResolvedValue(mockUser);

      const result = await repository.findOne(userId);

      expect(result).toBeDefined();
      expect(result.id).toBe(userId);
      expect(mockPrismaClient.appUser.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });

    it('ユーザーが存在しない場合、エラーをスローすること', async () => {
      const userId = 'non-existent-user';

      mockPrismaClient.appUser.findUnique.mockResolvedValue(null);

      await expect(repository.findOne(userId)).rejects.toThrow(
        AppUserFindError,
      );
      expect(mockPrismaClient.appUser.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });
  });

  describe('create', () => {
    it('新しいユーザーを作成できること', async () => {
      const userData = {
        id: 'user-1',
        displayName: 'Test User',
        firstName: 'Test',
        lastName: 'User',
        email: 'user@example.com',
        imageUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignInAt: null,
        stripeCustomerId: null,
        defaultPaymentMethodId: null,
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

      const mockUser = {
        ...userData,
      };

      const mockSubscription = {
        id: 'sub-1',
        userId: userData.id,
        planId: 'free-plan-id',
        startDate: expect.any(Date),
        endDate: expect(addDays(new Date(), 365)),
        isActive: true,
        status: 'ACTIVE',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      };

      mockPrismaClient.appUser.create.mockResolvedValue(mockUser);
      mockPrismaClient.subscription.create.mockResolvedValue(mockSubscription);

      const result = await repository.create(userData);

      expect(result).toBeDefined();
      expect(result.id).toBe(userData.id);
      expect(result.email).toBe(userData.email);
      expect(result.displayName).toBe(userData.displayName);
      expect(mockPrismaClient.appUser.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: userData.id,
          email: userData.email,
          displayName: userData.displayName,
        }),
      });
      expect(mockPrismaClient.subscription.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: userData.id,
          planId: appConfigService.FreePlanId,
          isActive: true,
          status: 'ACTIVE',
        }),
      });
    });
  });

  describe('update', () => {
    it('ユーザー情報を更新できること', async () => {
      const userData = {
        id: 'user-1',
        displayName: 'Updated User',
        firstName: 'Updated',
        lastName: 'User',
        email: 'user@example.com',
        imageUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignInAt: null,
        stripeCustomerId: null,
        defaultPaymentMethodId: null,
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

      const mockExistingUser = {
        id: userData.id,
        displayName: 'Original User',
        firstName: 'Original',
        lastName: 'User',
        email: userData.email,
        imageUrl: null,
        isActive: true,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
        lastSignInAt: null,
        stripeCustomerId: null,
        defaultPaymentMethodId: null,
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

      mockPrismaClient.appUser.findUnique.mockResolvedValue(mockExistingUser);
      mockPrismaClient.appUser.update.mockResolvedValue(userData);

      const result = await repository.update(userData);

      expect(result).toBeDefined();
      expect(result.id).toBe(userData.id);
      expect(result.displayName).toBe(userData.displayName);
      expect(mockPrismaClient.appUser.update).toHaveBeenCalledWith({
        where: { id: userData.id },
        data: userData,
      });
    });

    it('存在しないユーザーを更新しようとするとエラーをスローすること', async () => {
      const userData = {
        id: 'non-existent-user',
        displayName: 'Updated User',
        firstName: 'Updated',
        lastName: 'User',
        email: 'user@example.com',
        imageUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignInAt: null,
        stripeCustomerId: null,
        defaultPaymentMethodId: null,
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

      mockPrismaClient.appUser.findUnique.mockResolvedValue(null);

      await expect(repository.update(userData)).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('ユーザーを論理削除できること', async () => {
      const userId = 'user-1';
      const mockUser = {
        id: userId,
        email: 'user@example.com',
        displayName: 'Test User',
        firstName: 'Test',
        lastName: 'User',
        imageUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignInAt: null,
        stripeCustomerId: null,
        defaultPaymentMethodId: null,
        slackWebhookUrl: null,
        notificationEnabled: false,
        rssToken: null,
        rssEnabled: false,
        rssCreatedAt: null,
        rssUpdatedAt: null,
        personalizedProgramDialogueEnabled: false,
      };

      // トランザクション内で使用されるモックを追加
      mockPrismaClient.personalizedFeed = {
        updateMany: jest.fn(),
      };
      mockPrismaClient.subscription = {
        ...mockPrismaClient.subscription,
        updateMany: jest.fn(),
      };

      mockPrismaClient.appUser.findUnique.mockResolvedValue(mockUser);
      mockPrismaClient.appUser.update.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });
      mockPrismaClient.personalizedFeed.updateMany.mockResolvedValue({
        count: 2,
      });
      mockPrismaClient.subscription.updateMany.mockResolvedValue({ count: 1 });

      // トランザクションのモックを更新して、実際のコールバック関数を実行する
      prismaClientManager.transaction.mockImplementation(async (callback) => {
        return await callback();
      });

      await repository.delete(userId);

      expect(mockPrismaClient.appUser.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { isActive: false },
      });
      expect(mockPrismaClient.personalizedFeed.updateMany).toHaveBeenCalledWith(
        {
          where: { userId: userId, isActive: true },
          data: { isActive: false },
        },
      );
      expect(mockPrismaClient.subscription.updateMany).toHaveBeenCalledWith({
        where: { userId: userId, isActive: true },
        data: { isActive: false },
      });
    });

    it('存在しないユーザーを削除しようとするとエラーをスローすること', async () => {
      const userId = 'non-existent-user';

      mockPrismaClient.appUser.findUnique.mockResolvedValue(null);

      await expect(repository.delete(userId)).rejects.toThrow(
        'ユーザー [non-existent-user] の削除に失敗しました',
      );
    });
  });

  describe('findOneWithSubscription', () => {
    it('ユーザーとサブスクリプション情報を取得できること', async () => {
      const userId = 'user-1';
      const mockUser = {
        id: userId,
        email: 'user@example.com',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
        subscriptions: [
          {
            id: 'sub-1',
            userId,
            planId: 'plan-1',
            status: 'ACTIVE',
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            isActive: true,
            plan: {
              id: 'plan-1',
              name: 'Premium',
              description: 'Premium plan',
            },
          },
        ],
      };

      mockPrismaClient.appUser.findUnique.mockResolvedValue(mockUser);

      const result = await repository.findOneWithSubscription(userId);

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.id).toBe(userId);
      expect(result.subscription).toBeDefined();
      expect(result.subscription?.id).toBe('sub-1');
      expect(result.subscription?.status).toBe('ACTIVE');
      expect(mockPrismaClient.appUser.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        include: expect.objectContaining({
          subscriptions: expect.objectContaining({
            where: expect.objectContaining({
              isActive: true,
            }),
          }),
        }),
      });
    });

    it('サブスクリプションがないユーザーの場合、サブスクリプションがnullで返ること', async () => {
      const userId = 'user-1';
      const mockUser = {
        id: userId,
        displayName: 'Test User',
        firstName: 'Test',
        lastName: 'User',
        email: 'user@example.com',
        imageUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignInAt: null,
        stripeCustomerId: null,
        defaultPaymentMethodId: null,
        slackWebhookUrl: null,
        notificationEnabled: false,
        subscriptions: [],
      };

      mockPrismaClient.appUser.findUnique.mockResolvedValue(mockUser);

      const result = await repository.findOneWithSubscription(userId);

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.id).toBe(userId);
      expect(result.subscription).toBeNull();
    });
  });

  describe('findByRssToken', () => {
    it('RSSトークンでユーザーを検索できること', async () => {
      const rssToken = 'test-rss-token';
      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        displayName: 'Test User',
        rssToken,
        rssEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaClient.appUser.findUnique.mockResolvedValue(mockUser);

      const result = await repository.findByRssToken(rssToken);

      expect(result).toBeDefined();
      expect(result?.id).toBe('user-1');
      expect(result?.rssToken).toBe(rssToken);
      expect(mockPrismaClient.appUser.findUnique).toHaveBeenCalledWith({
        where: {
          rssToken,
          rssEnabled: true,
        },
      });
    });

    it('該当するユーザーが存在しない場合、nullを返すこと', async () => {
      const rssToken = 'non-existent-token';

      mockPrismaClient.appUser.findUnique.mockResolvedValue(null);

      const result = await repository.findByRssToken(rssToken);

      expect(result).toBeNull();
      expect(mockPrismaClient.appUser.findUnique).toHaveBeenCalledWith({
        where: {
          rssToken,
          rssEnabled: true,
        },
      });
    });
  });

  describe('updateRssSettings', () => {
    it('RSS機能を有効にできること（新しいトークン付き）', async () => {
      const userId = 'user-1';
      const rssToken = 'new-rss-token';
      const mockExistingUser = {
        id: userId,
        email: 'user@example.com',
        displayName: 'Test User',
        rssToken: null,
        rssEnabled: false,
        rssCreatedAt: null,
        rssUpdatedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdatedUser = {
        ...mockExistingUser,
        rssToken,
        rssEnabled: true,
        rssCreatedAt: new Date(),
        rssUpdatedAt: new Date(),
      };

      mockPrismaClient.appUser.findUnique.mockResolvedValue(mockExistingUser);
      mockPrismaClient.appUser.update.mockResolvedValue(mockUpdatedUser);

      const result = await repository.updateRssSettings(userId, true, rssToken);

      expect(result).toBeDefined();
      expect(result.rssEnabled).toBe(true);
      expect(result.rssToken).toBe(rssToken);
      expect(mockPrismaClient.appUser.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: expect.objectContaining({
          rssEnabled: true,
          rssToken,
          rssCreatedAt: expect.any(Date),
          rssUpdatedAt: expect.any(Date),
        }),
      });
    });

    it('RSS機能を無効にできること', async () => {
      const userId = 'user-1';
      const mockExistingUser = {
        id: userId,
        email: 'user@example.com',
        displayName: 'Test User',
        rssToken: 'existing-token',
        rssEnabled: true,
        rssCreatedAt: new Date(),
        rssUpdatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdatedUser = {
        ...mockExistingUser,
        rssToken: null,
        rssEnabled: false,
        rssCreatedAt: null,
        rssUpdatedAt: new Date(),
      };

      mockPrismaClient.appUser.findUnique.mockResolvedValue(mockExistingUser);
      mockPrismaClient.appUser.update.mockResolvedValue(mockUpdatedUser);

      const result = await repository.updateRssSettings(userId, false);

      expect(result).toBeDefined();
      expect(result.rssEnabled).toBe(false);
      expect(result.rssToken).toBeNull();
      expect(mockPrismaClient.appUser.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: expect.objectContaining({
          rssEnabled: false,
          rssToken: null,
          rssCreatedAt: null,
          rssUpdatedAt: expect.any(Date),
        }),
      });
    });

    it('既存のトークンがある場合、RSS機能を有効にできること', async () => {
      const userId = 'user-1';
      const mockExistingUser = {
        id: userId,
        email: 'user@example.com',
        displayName: 'Test User',
        rssToken: 'existing-token',
        rssEnabled: false,
        rssCreatedAt: new Date(),
        rssUpdatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdatedUser = {
        ...mockExistingUser,
        rssEnabled: true,
        rssUpdatedAt: new Date(),
      };

      mockPrismaClient.appUser.findUnique.mockResolvedValue(mockExistingUser);
      mockPrismaClient.appUser.update.mockResolvedValue(mockUpdatedUser);

      const result = await repository.updateRssSettings(userId, true);

      expect(result).toBeDefined();
      expect(result.rssEnabled).toBe(true);
      expect(result.rssToken).toBe('existing-token');
      expect(mockPrismaClient.appUser.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: expect.objectContaining({
          rssEnabled: true,
          rssUpdatedAt: expect.any(Date),
        }),
      });
    });
  });

  describe('regenerateRssToken', () => {
    it('RSSトークンを再生成できること', async () => {
      const userId = 'user-1';
      const newRssToken = 'new-rss-token';
      const mockExistingUser = {
        id: userId,
        email: 'user@example.com',
        displayName: 'Test User',
        rssToken: 'old-token',
        rssEnabled: true,
        rssCreatedAt: new Date(),
        rssUpdatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdatedUser = {
        ...mockExistingUser,
        rssToken: newRssToken,
        rssCreatedAt: new Date(),
        rssUpdatedAt: new Date(),
      };

      mockPrismaClient.appUser.findUnique.mockResolvedValue(mockExistingUser);
      mockPrismaClient.appUser.update.mockResolvedValue(mockUpdatedUser);

      const result = await repository.regenerateRssToken(userId, newRssToken);

      expect(result).toBeDefined();
      expect(result.rssToken).toBe(newRssToken);
      expect(mockPrismaClient.appUser.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: expect.objectContaining({
          rssToken: newRssToken,
          rssCreatedAt: expect.any(Date),
          rssUpdatedAt: expect.any(Date),
        }),
      });
    });

    it('RSS機能が無効なユーザーの場合、エラーをスローすること', async () => {
      const userId = 'user-1';
      const newRssToken = 'new-rss-token';
      const mockExistingUser = {
        id: userId,
        email: 'user@example.com',
        displayName: 'Test User',
        rssToken: null,
        rssEnabled: false,
        rssCreatedAt: null,
        rssUpdatedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaClient.appUser.findUnique.mockResolvedValue(mockExistingUser);

      await expect(
        repository.regenerateRssToken(userId, newRssToken),
      ).rejects.toThrow('RSSトークン再生成に失敗しました');
    });
  });
});
