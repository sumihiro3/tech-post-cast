import { PersonalizedProgramPersistenceError } from '@/types/errors';
import {
  PersonalizedProgramAudioGenerateResult,
  ProgramUploadResult,
} from '@domains/radio-program/personalized-feed';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppUser, Plan, QiitaPost, Subscription } from '@prisma/client';
import {
  PersonalizedFeedWithFilters,
  PrismaClientManager,
  UserWithSubscription,
} from '@tech-post-cast/database';
import { PersonalizedFeedsRepository } from './personalized-feeds.repository';

// モックデータ
const mockAppUser: AppUser = {
  id: 'user1',
  firstName: 'Test',
  lastName: 'User',
  displayName: 'Test User',
  email: 'test@example.com',
  imageUrl: 'https://example.com/image.jpg',
  isActive: true,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  lastSignInAt: new Date('2025-01-01'),
  stripeCustomerId: 'stripe_customer_id',
  defaultPaymentMethodId: 'default_payment_method_id',
  slackWebhookUrl: null,
  notificationEnabled: false,
  // RSS機能関連フィールド
  rssToken: null,
  rssEnabled: false,
  rssCreatedAt: null,
  rssUpdatedAt: null,
};

const mockSubscription: Subscription = {
  id: 'subscription1',
  userId: 'user1',
  planId: 'plan1',
  startDate: new Date('2025-01-01'),
  isActive: true,
  status: 'ACTIVE',
  endDate: new Date('2025-01-01'),
  cancelAt: new Date('2025-01-01'),
  canceledAt: new Date('2025-01-01'),
  trialStart: new Date('2025-01-01'),
  trialEnd: new Date('2025-01-01'),
  currentPeriodEnd: new Date('2025-01-01'),
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  stripeSubscriptionId: 'stripe_subscription_id',
  stripePriceId: 'stripe_price_id',
  currentPeriodStart: new Date('2025-01-01'),
};

const mockPlan: Plan = {
  id: 'plan1',
  name: 'Free',
  price: 0,
  description: 'Free plan',
  maxFeeds: 10,
  maxAuthors: 10,
  maxTags: 10,
  programDuration: 30,
  stripePriceId: 'stripe_price_id',
  stripePriceType: 'stripe_price_type',
  billingInterval: 'billing_interval',
  isActive: true,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

const mockUserWithSubscription: UserWithSubscription = {
  ...mockAppUser,
  subscriptions: [
    {
      ...mockSubscription,
      plan: mockPlan,
    },
  ],
};

// PersonalizedFeedWithFiltersの型に合わせてモックデータを修正
const mockPersonalizedFeed = {
  id: 'feed1',
  userId: 'user1',
  name: 'テストフィード',
  dataSource: 'Qiita',
  filterConfig: {} as any,
  deliveryConfig: {} as any,
  deliveryFrequency: 'WEEKLY',
  isActive: true,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  filterGroups: [],
} as PersonalizedFeedWithFilters;

const mockQiitaPosts: QiitaPost[] = [
  {
    id: 'post1',
    title: 'テスト記事1',
    body: 'テスト本文1',
    url: 'https://qiita.com/articles/post1',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    authorName: 'user1',
    authorId: 'user1',
    likesCount: 10,
    stocksCount: 5,
    private: false,
    refreshedAt: new Date('2025-01-01'),
    summary: 'テスト要約1',
    headlineTopicProgramId: null,
  },
  {
    id: 'post2',
    title: 'テスト記事2',
    body: 'テスト本文2',
    url: 'https://qiita.com/articles/post2',
    createdAt: new Date('2025-01-02'),
    updatedAt: new Date('2025-01-02'),
    authorName: 'user2',
    authorId: 'user2',
    likesCount: 20,
    stocksCount: 10,
    private: false,
    refreshedAt: new Date('2025-01-02'),
    summary: 'テスト要約2',
    headlineTopicProgramId: null,
  },
];

// PersonalizedProgramScript型に合わせて修正
const mockProgramGenerateResult: PersonalizedProgramAudioGenerateResult = {
  audioFileName: 'test.mp3',
  audioFilePath: '/tmp/test.mp3',
  audioDuration: 1000,
  script: {
    title: 'テスト番組',
    opening: 'これはテスト番組です',
    posts: [
      {
        id: 'post1',
        title: 'テスト記事1',
        intro: 'テスト記事1の紹介',
        explanation: 'テスト記事1の説明',
        summary: 'テスト記事1のまとめ',
      },
      {
        id: 'post2',
        title: 'テスト記事2',
        intro: 'テスト記事2の紹介',
        explanation: 'テスト記事2の説明',
        summary: 'テスト記事2のまとめ',
      },
    ],
    ending: 'これでテスト番組を終わります',
  },
  chapters: [],
};

const mockUploadResult: ProgramUploadResult = {
  audioUrl: 'https://example.com/audio.mp3',
};

// PrismaClientManagerのモック
const mockPrismaClientManager = {
  getClient: jest.fn(),
  transaction: jest.fn(),
};

// トランザクション内のクライアントのモック
const mockClient = {
  personalizedFeed: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  personalizedFeedProgram: {
    create: jest.fn(),
  },
};

describe('PersonalizedFeedsRepository', () => {
  let repository: PersonalizedFeedsRepository;
  let prismaClientManager: PrismaClientManager;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PersonalizedFeedsRepository,
        {
          provide: PrismaClientManager,
          useValue: mockPrismaClientManager,
        },
        {
          provide: Logger,
          useValue: {
            debug: jest.fn(),
            verbose: jest.fn(),
            log: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get<PersonalizedFeedsRepository>(
      PersonalizedFeedsRepository,
    );
    prismaClientManager = module.get<PrismaClientManager>(PrismaClientManager);

    // モック関数のリセット
    jest.clearAllMocks();

    // getClientのデフォルト実装
    mockPrismaClientManager.getClient.mockReturnValue(mockClient);
  });

  describe('createPersonalizedProgram', () => {
    it('パーソナライズプログラムを正常に作成すること', async () => {
      // createメソッドのモック応答を設定
      const mockCreatedProgram = {
        id: 'program1',
        userId: mockAppUser.id,
        feedId: mockPersonalizedFeed.id,
        title: mockProgramGenerateResult.script.title,
        audioUrl: mockUploadResult.audioUrl,
        imageUrl: null,
        audioDuration: mockProgramGenerateResult.audioDuration,
        createdAt: new Date(),
        updatedAt: new Date(),
        posts: mockQiitaPosts,
      };

      mockClient.personalizedFeedProgram.create.mockResolvedValue(
        mockCreatedProgram,
      );

      // テスト対象のメソッドを呼び出し
      const result = await repository.createPersonalizedProgram(
        mockUserWithSubscription,
        mockPersonalizedFeed,
        new Date(),
        mockQiitaPosts,
        mockProgramGenerateResult,
        mockUploadResult,
      );

      // getClientが呼ばれたことを確認
      expect(mockPrismaClientManager.getClient).toHaveBeenCalled();

      // createメソッドが正しいパラメータで呼ばれたことを確認
      expect(mockClient.personalizedFeedProgram.create).toHaveBeenCalledWith({
        data: {
          userId: mockAppUser.id,
          feedId: mockPersonalizedFeed.id,
          title: mockProgramGenerateResult.script.title,
          script: expect.any(Object),
          audioUrl: mockUploadResult.audioUrl,
          imageUrl: null,
          audioDuration: mockProgramGenerateResult.audioDuration,
          chapters: expect.any(Object),
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
          expiresAt: expect.any(Date),
          isExpired: expect.any(Boolean),
          posts: {
            connect: mockQiitaPosts.map((post) => ({ id: post.id })),
          },
        },
        include: {
          posts: true,
        },
      });

      // 結果が正しいことを確認
      expect(result).toEqual(mockCreatedProgram);
    });

    it('DBエラー時にPersonalizedProgramPersistenceErrorをスローすること', async () => {
      // createメソッドがエラーをスローするように設定
      const mockError = new Error('DB error');
      mockClient.personalizedFeedProgram.create.mockRejectedValue(mockError);

      // テスト対象のメソッドを呼び出し、エラーをキャッチ
      await expect(
        repository.createPersonalizedProgram(
          mockUserWithSubscription,
          mockPersonalizedFeed,
          new Date(),
          mockQiitaPosts,
          mockProgramGenerateResult,
          mockUploadResult,
        ),
      ).rejects.toThrow(PersonalizedProgramPersistenceError);

      // getClientが呼ばれたことを確認
      expect(mockPrismaClientManager.getClient).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('指定IDのパーソナルフィードを取得すること', async () => {
      // findUniqueメソッドのモック応答を設定
      mockClient.personalizedFeed.findUnique.mockResolvedValue(
        mockPersonalizedFeed,
      );

      // テスト対象のメソッドを呼び出し
      const result = await repository.findOne('feed1');

      // getClientが呼ばれたことを確認
      expect(mockPrismaClientManager.getClient).toHaveBeenCalled();

      // findUniqueメソッドが正しいパラメータで呼ばれたことを確認
      expect(mockClient.personalizedFeed.findUnique).toHaveBeenCalledWith({
        where: { id: 'feed1' },
        include: {
          user: true,
          filterGroups: {
            include: {
              tagFilters: true,
              authorFilters: true,
              dateRangeFilters: true,
              likesCountFilters: true,
            },
          },
        },
      });

      // 結果が正しいことを確認
      expect(result).toEqual(mockPersonalizedFeed);
    });
  });

  describe('findActiveByUser', () => {
    it('指定ユーザーのアクティブなパーソナルフィード一覧を取得すること', async () => {
      // findManyメソッドのモック応答を設定
      mockClient.personalizedFeed.findMany.mockResolvedValue([
        mockPersonalizedFeed,
      ]);

      // テスト対象のメソッドを呼び出し
      const result = await repository.findActiveByUser(mockAppUser);

      // getClientが呼ばれたことを確認
      expect(mockPrismaClientManager.getClient).toHaveBeenCalled();

      // findManyメソッドが正しいパラメータで呼ばれたことを確認
      expect(mockClient.personalizedFeed.findMany).toHaveBeenCalledWith({
        where: {
          userId: mockAppUser.id,
          isActive: true,
        },
        include: {
          filterGroups: {
            include: {
              tagFilters: true,
              authorFilters: true,
              dateRangeFilters: true,
              likesCountFilters: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      // 結果が正しいことを確認
      expect(result).toEqual([mockPersonalizedFeed]);
    });
  });

  describe('count', () => {
    it('パーソナルフィードの件数を取得すること', async () => {
      // countメソッドのモック応答を設定
      mockClient.personalizedFeed.count.mockResolvedValue(1);

      // テスト対象のメソッドを呼び出し
      const result = await repository.count();

      // getClientが呼ばれたことを確認
      expect(mockPrismaClientManager.getClient).toHaveBeenCalled();

      // countメソッドが呼ばれたことを確認
      expect(mockClient.personalizedFeed.count).toHaveBeenCalled();

      // 結果が正しいことを確認
      expect(result).toBe(1);
    });
  });

  describe('find', () => {
    it('パーソナルフィード一覧を取得すること', async () => {
      // countメソッドのモック応答を設定
      mockClient.personalizedFeed.count.mockResolvedValue(1);
      // findManyメソッドのモック応答を設定
      mockClient.personalizedFeed.findMany.mockResolvedValue([
        mockPersonalizedFeed,
      ]);

      // テスト対象のメソッドを呼び出し
      const result = await repository.find(1, 10);

      // getClientが呼ばれたことを確認
      expect(mockPrismaClientManager.getClient).toHaveBeenCalled();

      // findManyメソッドが正しいパラメータで呼ばれたことを確認
      expect(mockClient.personalizedFeed.findMany).toHaveBeenCalledWith({
        take: 10,
        skip: 0,
        include: {
          user: true,
          filterGroups: {
            include: {
              tagFilters: true,
              authorFilters: true,
              dateRangeFilters: true,
              likesCountFilters: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      // 結果が正しいことを確認
      expect(result).toEqual([mockPersonalizedFeed]);
    });

    it('limit <= 0 の場合は全件を取得すること', async () => {
      // countメソッドのモック応答を設定
      mockClient.personalizedFeed.count.mockResolvedValue(5);
      // findManyメソッドのモック応答を設定
      mockClient.personalizedFeed.findMany.mockResolvedValue([
        mockPersonalizedFeed,
      ]);

      // テスト対象のメソッドを呼び出し
      const result = await repository.find(1, 0);

      // getClientが呼ばれたことを確認
      expect(mockPrismaClientManager.getClient).toHaveBeenCalled();

      // countメソッドが呼ばれたことを確認
      expect(mockClient.personalizedFeed.count).toHaveBeenCalled();

      // findManyメソッドが正しいパラメータで呼ばれたことを確認
      expect(mockClient.personalizedFeed.findMany).toHaveBeenCalledWith({
        take: 5, // countの結果が使われていること
        skip: 0,
        include: {
          user: true,
          filterGroups: {
            include: {
              tagFilters: true,
              authorFilters: true,
              dateRangeFilters: true,
              likesCountFilters: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      // 結果が正しいことを確認
      expect(result).toEqual([mockPersonalizedFeed]);
    });
  });
});
