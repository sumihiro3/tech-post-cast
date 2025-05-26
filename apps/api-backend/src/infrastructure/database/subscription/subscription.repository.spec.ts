import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClientManager } from '@tech-post-cast/database';
import { SubscriptionRepository } from './subscription.repository';
import { suppressLogOutput, restoreLogOutput } from '../../../test/helpers/logger.helper';
import { SubscriptionStatus } from '@tech-post-cast/database';
import { PlanNotFoundError } from '../../../types/errors';

describe('SubscriptionRepository', () => {
  let repository: SubscriptionRepository;
  let prismaClientManager: jest.Mocked<PrismaClientManager>;
  let logSpies: jest.SpyInstance[];
  let mockPrismaClient: any;

  beforeEach(async () => {
    logSpies = suppressLogOutput();

    mockPrismaClient = {
      subscription: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      subscriptionHistory: {
        create: jest.fn(),
      },
    };

    prismaClientManager = {
      getClient: jest.fn().mockReturnValue(mockPrismaClient),
      transaction: jest.fn().mockImplementation(async (callback) => {
        return await callback();
      }),
    } as unknown as jest.Mocked<PrismaClientManager>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionRepository,
        {
          provide: PrismaClientManager,
          useValue: prismaClientManager,
        },
      ],
    }).compile();

    repository = module.get<SubscriptionRepository>(SubscriptionRepository);
  });

  afterEach(() => {
    restoreLogOutput(logSpies);
  });

  describe('findByUserId', () => {
    it('ユーザーIDに基づいてサブスクリプションを取得できること', async () => {
      const userId = 'user-1';
      const now = new Date();
      const mockSubscription = {
        id: 'sub-1',
        userId,
        planId: 'plan-1',
        status: SubscriptionStatus.ACTIVE,
        startDate: now,
        endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
        createdAt: now,
        updatedAt: now,
        plan: {
          id: 'plan-1',
          name: 'Premium',
          description: 'Premium plan',
          price: 1000,
          isActive: true,
          maxFeeds: 5,
          maxAuthors: 10,
          maxTags: 20,
        },
      };

      mockPrismaClient.subscription.findFirst.mockResolvedValue(mockSubscription);

      const result = await repository.findByUserId(userId);

      expect(result).toBeDefined();
      expect(result?.id).toBe('sub-1');
      expect(result?.userId).toBe(userId);
      expect(result?.status).toBe(SubscriptionStatus.ACTIVE);
      expect(result?.plan).toBeDefined();
      expect(result?.plan?.maxFeeds).toBe(5);
      expect(mockPrismaClient.subscription.findFirst).toHaveBeenCalledWith({
        where: {
          userId,
          isActive: true,
        },
        include: {
          plan: true,
        },
        orderBy: {
          startDate: 'desc',
        },
      });
    });

    it('サブスクリプションが存在しない場合、nullを返すこと', async () => {
      const userId = 'user-1';

      mockPrismaClient.subscription.findFirst.mockResolvedValue(null);

      const result = await repository.findByUserId(userId);

      expect(result).toBeNull();
      expect(mockPrismaClient.subscription.findFirst).toHaveBeenCalledWith({
        where: {
          userId,
          isActive: true,
        },
        include: {
          plan: true,
        },
        orderBy: {
          startDate: 'desc',
        },
      });
    });
  });

  describe('createSubscriptionHistory', () => {
    it('サブスクリプション履歴を作成できること', async () => {
      const now = new Date();
      const data = {
        subscriptionId: 'sub-1',
        userId: 'user-1',
        planId: 'plan-1',
        status: SubscriptionStatus.ACTIVE,
        startDate: now,
      };

      const mockHistory = {
        id: 'history-1',
        subscriptionId: 'sub-1',
        userId: 'user-1',
        planId: 'plan-1',
        status: SubscriptionStatus.ACTIVE,
        startDate: now,
        endDate: null,
        createdAt: now,
      };

      mockPrismaClient.subscriptionHistory.create.mockResolvedValue(mockHistory);

      const result = await repository.createSubscriptionHistory(data);

      expect(result).toBeDefined();
      expect(result.id).toBe('history-1');
      expect(result.subscriptionId).toBe('sub-1');
      expect(result.userId).toBe('user-1');
      expect(result.status).toBe(SubscriptionStatus.ACTIVE);
      expect(mockPrismaClient.subscriptionHistory.create).toHaveBeenCalledWith({
        data: {
          subscription: { connect: { id: data.subscriptionId } },
          user: { connect: { id: data.userId } },
          plan: { connect: { id: data.planId } },
          status: data.status,
          startDate: data.startDate,
          endDate: undefined,
        },
      });
    });
  });

  describe('findCurrentSubscription', () => {
    it('ユーザーの現在のサブスクリプション情報を取得できること', async () => {
      const userId = 'user-1';
      const now = new Date();
      const mockSubscription = {
        id: 'sub-1',
        userId,
        planId: 'plan-1',
        status: SubscriptionStatus.ACTIVE,
        startDate: now,
        endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
        createdAt: now,
        updatedAt: now,
        plan: {
          id: 'plan-1',
          name: 'Premium',
          description: 'Premium plan',
          price: 1000,
          isActive: true,
          maxFeeds: 5,
          maxAuthors: 10,
          maxTags: 20,
        },
      };

      mockPrismaClient.subscription.findFirst.mockResolvedValue(mockSubscription);

      const result = await repository.findCurrentSubscription(userId);

      expect(result).toBeDefined();
      expect(result.subscription).toBeDefined();
      expect(result.subscription?.id).toBe('sub-1');
      expect(result.plan).toBeDefined();
      expect(result.plan?.id).toBe('plan-1');
      expect(result.status).toBe(SubscriptionStatus.ACTIVE);
      expect(mockPrismaClient.subscription.findFirst).toHaveBeenCalledWith({
        where: {
          userId,
          isActive: true,
        },
        include: {
          plan: true,
        },
        orderBy: {
          startDate: 'desc',
        },
      });
    });

    it('サブスクリプションが存在しない場合、適切な結果を返すこと', async () => {
      const userId = 'user-1';

      mockPrismaClient.subscription.findFirst.mockResolvedValue(null);

      const result = await repository.findCurrentSubscription(userId);

      expect(result).toBeDefined();
      expect(result.subscription).toBeNull();
      expect(result.plan).toBeNull();
      expect(result.status).toBe(SubscriptionStatus.NONE);
      expect(mockPrismaClient.subscription.findFirst).toHaveBeenCalledWith({
        where: {
          userId,
          isActive: true,
        },
        include: {
          plan: true,
        },
        orderBy: {
          startDate: 'desc',
        },
      });
    });
  });

  describe('getPlanLimits', () => {
    it('ユーザーのプラン制限を取得できること', async () => {
      const userId = 'user-1';
      const now = new Date();
      const mockSubscription = {
        id: 'sub-1',
        userId,
        planId: 'plan-1',
        status: SubscriptionStatus.ACTIVE,
        startDate: now,
        endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
        createdAt: now,
        updatedAt: now,
        plan: {
          id: 'plan-1',
          name: 'Premium',
          description: 'Premium plan',
          price: 1000,
          isActive: true,
          maxFeeds: 5,
          maxAuthors: 10,
          maxTags: 20,
        },
      };

      mockPrismaClient.subscription.findFirst.mockResolvedValue(mockSubscription);

      const result = await repository.getPlanLimits(userId);

      expect(result).toBeDefined();
      expect(result.maxFeeds).toBe(5);
      expect(result.maxAuthors).toBe(10);
      expect(result.maxTags).toBe(20);
      expect(mockPrismaClient.subscription.findFirst).toHaveBeenCalledWith({
        where: {
          userId,
          isActive: true,
        },
        include: {
          plan: true,
        },
        orderBy: {
          startDate: 'desc',
        },
      });
    });

    it('アクティブなサブスクリプションが見つからない場合、エラーをスローすること', async () => {
      const userId = 'user-1';

      mockPrismaClient.subscription.findFirst.mockResolvedValue(null);

      await expect(repository.getPlanLimits(userId)).rejects.toThrow(PlanNotFoundError);
      expect(mockPrismaClient.subscription.findFirst).toHaveBeenCalledWith({
        where: {
          userId,
          isActive: true,
        },
        include: {
          plan: true,
        },
        orderBy: {
          startDate: 'desc',
        },
      });
    });
  });

  describe('createSubscription', () => {
    it('新しいサブスクリプションを作成できること', async () => {
      const now = new Date();
      const data = {
        userId: 'user-1',
        planId: 'plan-1',
        startDate: now,
      };

      const mockSubscription = {
        id: 'sub-1',
        userId: 'user-1',
        planId: 'plan-1',
        startDate: now,
        endDate: null,
        isActive: true,
        status: SubscriptionStatus.ACTIVE,
        createdAt: now,
        updatedAt: now,
      };

      const mockHistory = {
        id: 'history-1',
        subscriptionId: 'sub-1',
        userId: 'user-1',
        planId: 'plan-1',
        status: SubscriptionStatus.ACTIVE,
        startDate: now,
        endDate: null,
        createdAt: now,
      };

      mockPrismaClient.subscription.create.mockResolvedValue(mockSubscription);
      mockPrismaClient.subscriptionHistory.create.mockResolvedValue(mockHistory);

      const result = await repository.createSubscription(data);

      expect(result).toBeDefined();
      expect(result.id).toBe('history-1');
      expect(result.subscriptionId).toBe('sub-1');
      expect(result.userId).toBe('user-1');
      expect(result.status).toBe(SubscriptionStatus.ACTIVE);
      expect(mockPrismaClient.subscription.create).toHaveBeenCalledWith({
        data: {
          userId: data.userId,
          planId: data.planId,
          startDate: data.startDate,
          endDate: undefined,
          isActive: true,
          status: SubscriptionStatus.ACTIVE,
        },
      });
      expect(mockPrismaClient.subscriptionHistory.create).toHaveBeenCalled();
    });
  });
});
