import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SubscriptionService } from './subscription.service';
import { ISubscriptionRepository, CurrentSubscriptionInfo } from './subscription.repository.interface';
import { suppressLogOutput, restoreLogOutput } from '../../test/helpers/logger.helper';
import { SubscriptionStatus } from '@tech-post-cast/database';
import { SUBSCRIPTION_EVENTS } from './subscription.constants';

describe('SubscriptionService', () => {
  let service: SubscriptionService;
  let subscriptionRepository: jest.Mocked<ISubscriptionRepository>;
  let eventEmitter: jest.Mocked<EventEmitter2>;
  let logSpies: jest.SpyInstance[];

  beforeEach(async () => {
    logSpies = suppressLogOutput();

    const mockSubscriptionRepository = {
      findByUserId: jest.fn(),
      findCurrentSubscription: jest.fn(),
      createSubscriptionHistory: jest.fn(),
      getPlanLimits: jest.fn(),
      createSubscription: jest.fn(),
    };

    const mockEventEmitter = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionService,
        {
          provide: 'SubscriptionRepository',
          useValue: mockSubscriptionRepository,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<SubscriptionService>(SubscriptionService);
    subscriptionRepository = module.get('SubscriptionRepository') as jest.Mocked<ISubscriptionRepository>;
    eventEmitter = module.get(EventEmitter2) as jest.Mocked<EventEmitter2>;
  });

  afterEach(() => {
    restoreLogOutput(logSpies);
  });

  describe('getSubscriptionStatus', () => {
    it('ユーザーのサブスクリプション状態を取得できること', async () => {
      const userId = 'user-1';
      const mockSubscription = {
        id: 'sub-1',
        userId,
        planId: 'plan-1',
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date(),
        endDate: new Date(),
        isActive: true,
      };

      subscriptionRepository.findByUserId.mockResolvedValue(mockSubscription);

      const result = await service.getSubscriptionStatus(userId);

      expect(result).toBeDefined();
      expect(result).toBe(SubscriptionStatus.ACTIVE);
      expect(subscriptionRepository.findByUserId).toHaveBeenCalledWith(userId);
    });

    it('サブスクリプションが存在しない場合、未登録状態を返すこと', async () => {
      const userId = 'user-1';

      subscriptionRepository.findByUserId.mockResolvedValue(null);

      const result = await service.getSubscriptionStatus(userId);

      expect(result).toBeDefined();
      expect(result).toBe(SubscriptionStatus.NONE);
      expect(subscriptionRepository.findByUserId).toHaveBeenCalledWith(userId);
    });
  });

  describe('getPlanLimits', () => {
    it('ユーザーのプラン制限を取得できること', async () => {
      const userId = 'user-1';
      const mockLimits = {
        maxFeeds: 5,
        maxAuthors: 10,
        maxTags: 20,
      };

      subscriptionRepository.getPlanLimits.mockResolvedValue(mockLimits);

      const result = await service.getPlanLimits(userId);

      expect(result).toBeDefined();
      expect(result.maxFeeds).toBe(5);
      expect(result.maxAuthors).toBe(10);
      expect(result.maxTags).toBe(20);
      expect(subscriptionRepository.getPlanLimits).toHaveBeenCalledWith(userId);
    });
  });

  describe('recordSubscriptionHistory', () => {
    it('サブスクリプション履歴を記録できること', async () => {
      const userId = 'user-1';
      const planId = 'plan-1';
      const status = SubscriptionStatus.ACTIVE;
      const now = new Date();
      
      const mockCurrentSubscription: CurrentSubscriptionInfo = {
        subscription: {
          id: 'sub-1',
          userId,
          planId,
          status: status as string,
          startDate: now,
          endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          isActive: true,
          createdAt: now,
          updatedAt: now,
          stripeSubscriptionId: null,
          stripePriceId: null,
          currentPeriodStart: now,
          currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          cancelAt: null,
          canceledAt: null,
          trialStart: null,
          trialEnd: null,
        },
        plan: {
          id: planId,
          name: 'Premium',
          description: 'Premium plan',
          price: 1000,
          isActive: true,
          createdAt: now,
          updatedAt: now,
          stripePriceId: null,
          stripePriceType: 'recurring',
          billingInterval: 'month',
          maxFeeds: 5,
          maxAuthors: 10,
          maxTags: 20,
          programDuration: 30,
        },
        status: SubscriptionStatus.ACTIVE,
      };

      const mockHistory = {
        id: 'history-1',
        subscriptionId: 'sub-1',
        userId,
        planId,
        status: status as string,
        startDate: now,
        endDate: null,
        createdAt: now,
        stripeSubscriptionId: null,
        stripePriceId: null,
        stripeEventId: null,
        stripeEventType: null,
        currentPeriodStart: null,
        currentPeriodEnd: null,
        cancelAt: null,
        canceledAt: null,
      };

      subscriptionRepository.findCurrentSubscription.mockResolvedValue(mockCurrentSubscription);
      subscriptionRepository.createSubscriptionHistory.mockResolvedValue(mockHistory);

      await service.recordSubscriptionHistory(userId, status, planId);

      expect(subscriptionRepository.findCurrentSubscription).toHaveBeenCalledWith(userId);
      expect(subscriptionRepository.createSubscriptionHistory).toHaveBeenCalledWith({
        subscriptionId: mockCurrentSubscription.subscription!.id,
        userId,
        status,
        planId,
        startDate: expect.any(Date),
      });
    });

    it('アクティブなサブスクリプションが見つからない場合、履歴を記録しないこと', async () => {
      const userId = 'user-1';
      const planId = 'plan-1';
      const status = SubscriptionStatus.ACTIVE;

      const mockCurrentSubscription: CurrentSubscriptionInfo = {
        subscription: null,
        plan: null,
        status: SubscriptionStatus.NONE,
      };

      subscriptionRepository.findCurrentSubscription.mockResolvedValue(mockCurrentSubscription);

      await service.recordSubscriptionHistory(userId, status, planId);

      expect(subscriptionRepository.findCurrentSubscription).toHaveBeenCalledWith(userId);
      expect(subscriptionRepository.createSubscriptionHistory).not.toHaveBeenCalled();
    });
  });

  describe('updateSubscriptionStatus', () => {
    it('サブスクリプション状態を更新し、イベントを発行すること', async () => {
      const userId = 'user-1';
      const planId = 'plan-1';
      const status = SubscriptionStatus.ACTIVE;
      const now = new Date();
      
      const mockCurrentSubscription: CurrentSubscriptionInfo = {
        subscription: {
          id: 'sub-1',
          userId,
          planId,
          status: status as string,
          startDate: now,
          endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          isActive: true,
          createdAt: now,
          updatedAt: now,
          stripeSubscriptionId: null,
          stripePriceId: null,
          currentPeriodStart: now,
          currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          cancelAt: null,
          canceledAt: null,
          trialStart: null,
          trialEnd: null,
        },
        plan: {
          id: planId,
          name: 'Premium',
          description: 'Premium plan',
          price: 1000,
          isActive: true,
          createdAt: now,
          updatedAt: now,
          stripePriceId: null,
          stripePriceType: 'recurring',
          billingInterval: 'month',
          maxFeeds: 5,
          maxAuthors: 10,
          maxTags: 20,
          programDuration: 30,
        },
        status: SubscriptionStatus.ACTIVE,
      };

      const mockHistory = {
        id: 'history-1',
        subscriptionId: 'sub-1',
        userId,
        planId,
        status: status as string,
        startDate: now,
        endDate: null,
        createdAt: now,
        stripeSubscriptionId: null,
        stripePriceId: null,
        stripeEventId: null,
        stripeEventType: null,
        currentPeriodStart: null,
        currentPeriodEnd: null,
        cancelAt: null,
        canceledAt: null,
      };

      subscriptionRepository.findCurrentSubscription.mockResolvedValue(mockCurrentSubscription);
      subscriptionRepository.createSubscriptionHistory.mockResolvedValue(mockHistory);

      await service.updateSubscriptionStatus(userId, status, planId);

      expect(subscriptionRepository.findCurrentSubscription).toHaveBeenCalledWith(userId);
      expect(subscriptionRepository.createSubscriptionHistory).toHaveBeenCalledWith({
        subscriptionId: mockCurrentSubscription.subscription!.id,
        userId,
        status,
        planId,
        startDate: expect.any(Date),
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith(SUBSCRIPTION_EVENTS.STATUS_CHANGED, expect.objectContaining({
        userId,
        status,
        timestamp: expect.any(Date),
      }));
    });
  });
});
