import { AppConfigService } from '@/app-config/app-config.service';
import { AppUserFindError } from '@/types/errors/app-user.error';
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
      };

      const mockUser = {
        ...userData,
      };

      const mockSubscription = {
        id: 'sub-1',
        userId: userData.id,
        planId: 'free-plan-id',
        startDate: expect.any(Date),
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
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaClient.appUser.findUnique.mockResolvedValue(mockUser);
      mockPrismaClient.appUser.update.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      await repository.delete(userId);

      expect(mockPrismaClient.appUser.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { isActive: false },
      });
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
});
