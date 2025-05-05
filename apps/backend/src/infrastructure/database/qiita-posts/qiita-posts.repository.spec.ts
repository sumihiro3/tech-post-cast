import { QiitaPostApiResponse } from '@domains/qiita-posts/qiita-posts.entity';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@tech-post-cast/database';
import { QiitaPostsRepository } from './qiita-posts.repository';

// モックデータ
const mockQiitaPosts: QiitaPostApiResponse[] = [
  {
    id: 'post1',
    title: 'テスト記事1',
    rendered_body: '<p>テスト本文1</p>',
    body: 'テスト本文1',
    url: 'https://qiita.com/articles/post1',
    created_at: '2025-01-01T00:00:00+09:00',
    updated_at: '2025-01-01T00:00:00+09:00',
    user: {
      id: 'user1',
      followees_count: 0,
      followers_count: 0,
      items_count: 0,
      permanent_id: 1,
      profile_image_url: 'https://example.com/image.jpg',
      team_only: false,
    },
    comments_count: 0,
    likes_count: 10,
    reactions_count: 0,
    stocks_count: 5,
    private: false,
    tags: [{ name: 'テスト', versions: [] }],
    coediting: false,
    group: null,
    team_membership: null,
    slide: false,
    summary: 'テスト要約1',
  },
  {
    id: 'post2',
    title: 'テスト記事2',
    rendered_body: '<p>テスト本文2</p>',
    body: 'テスト本文2',
    url: 'https://qiita.com/articles/post2',
    created_at: '2025-01-02T00:00:00+09:00',
    updated_at: '2025-01-02T00:00:00+09:00',
    user: {
      id: 'user2',
      followees_count: 0,
      followers_count: 0,
      items_count: 0,
      permanent_id: 2,
      profile_image_url: 'https://example.com/image2.jpg',
      team_only: false,
    },
    comments_count: 0,
    likes_count: 20,
    reactions_count: 0,
    stocks_count: 10,
    private: false,
    tags: [{ name: 'テスト', versions: [] }],
    coediting: false,
    group: null,
    team_membership: null,
    slide: false,
    summary: 'テスト要約2',
  },
  {
    id: 'post3',
    title: 'テスト記事3',
    rendered_body: '<p>テスト本文3</p>',
    body: 'テスト本文3',
    url: 'https://qiita.com/articles/post3',
    created_at: '2025-01-03T00:00:00+09:00',
    updated_at: '2025-01-03T00:00:00+09:00',
    user: {
      id: 'user3',
      followees_count: 0,
      followers_count: 0,
      items_count: 0,
      permanent_id: 3,
      profile_image_url: 'https://example.com/image3.jpg',
      team_only: false,
    },
    comments_count: 0,
    likes_count: 30,
    reactions_count: 0,
    stocks_count: 15,
    private: false,
    tags: [{ name: 'テスト', versions: [] }],
    coediting: false,
    group: null,
    team_membership: null,
    slide: false,
    summary: 'テスト要約3',
  },
];

// 実装コードに合わせたPrismaServiceのモック
const mockPrismaService = {
  personalizedFeedProgram: {
    findMany: jest.fn(),
  },
  getClient: jest.fn().mockReturnThis(),
};

describe('QiitaPostsRepository', () => {
  let repository: QiitaPostsRepository;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QiitaPostsRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: Logger,
          useValue: {
            verbose: jest.fn(),
            debug: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get<QiitaPostsRepository>(QiitaPostsRepository);
    prismaService = module.get<PrismaService>(PrismaService);

    // モック関数のリセット
    jest.clearAllMocks();
  });

  describe('findNotExistsPostsByPersonalizedFeedId', () => {
    it('パーソナライズフィードプログラムに存在しない記事のみを返すこと', async () => {
      // 実装コードに合わせたモックの応答設定
      const existsPostId = 'post1';
      const mockExistingProgramPosts = [
        {
          id: 'program1',
          feedId: 'feed1',
          posts: [{ id: existsPostId }],
        },
      ];

      // モックの戻り値を設定
      mockPrismaService.personalizedFeedProgram.findMany.mockResolvedValue(
        mockExistingProgramPosts,
      );

      // テスト対象のメソッドを呼び出し
      const result = await repository.findNotExistsPostsByPersonalizedFeedId(
        'feed1',
        mockQiitaPosts,
      );

      // 正しいパラメータでfindManyが呼ばれたことを確認
      expect(
        mockPrismaService.personalizedFeedProgram.findMany,
      ).toHaveBeenCalledWith({
        where: {
          feedId: 'feed1',
        },
        include: {
          posts: {
            select: {
              id: true,
            },
          },
        },
      });

      // post1が除外され、post2とpost3のみが結果に含まれることを確認
      expect(result.length).toBe(2);
      expect(result.map((post) => post.id).sort()).toEqual(['post2', 'post3']);
      expect(result).toEqual(
        mockQiitaPosts.filter((post) => post.id !== existsPostId),
      );
    });

    it('全ての記事がプログラムに含まれている場合は空配列を返すこと', async () => {
      // 全ての記事が既存のプログラムに含まれていると仮定
      const mockExistingProgramPosts = [
        {
          id: 'program1',
          feedId: 'feed1',
          posts: mockQiitaPosts.map((post) => ({ id: post.id })),
        },
      ];

      // モックの戻り値を設定
      mockPrismaService.personalizedFeedProgram.findMany.mockResolvedValue(
        mockExistingProgramPosts,
      );

      // テスト対象のメソッドを呼び出し
      const result = await repository.findNotExistsPostsByPersonalizedFeedId(
        'feed1',
        mockQiitaPosts,
      );

      // 空配列が返されることを確認
      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });

    it('プログラムに記事が含まれていない場合は全ての記事を返すこと', async () => {
      // プログラムに含まれる記事がない場合
      const mockExistingProgramPosts = [
        {
          id: 'program1',
          feedId: 'feed1',
          posts: [],
        },
      ];

      // モックの戻り値を設定
      mockPrismaService.personalizedFeedProgram.findMany.mockResolvedValue(
        mockExistingProgramPosts,
      );

      // テスト対象のメソッドを呼び出し
      const result = await repository.findNotExistsPostsByPersonalizedFeedId(
        'feed1',
        mockQiitaPosts,
      );

      // 全ての記事が返されることを確認
      expect(result).toEqual(mockQiitaPosts);
      expect(result.length).toBe(mockQiitaPosts.length);
    });

    it('プログラムが存在しない場合は全ての記事を返すこと', async () => {
      // プログラムが存在しない場合
      const mockExistingProgramPosts = [];

      // モックの戻り値を設定
      mockPrismaService.personalizedFeedProgram.findMany.mockResolvedValue(
        mockExistingProgramPosts,
      );

      // テスト対象のメソッドを呼び出し
      const result = await repository.findNotExistsPostsByPersonalizedFeedId(
        'feed1',
        mockQiitaPosts,
      );

      // 全ての記事が返されることを確認
      expect(result).toEqual(mockQiitaPosts);
      expect(result.length).toBe(mockQiitaPosts.length);
    });

    it('エラーが発生した場合は適切にエラーをスローすること', async () => {
      // エラーを発生させる
      const mockError = new Error('データベースエラー');
      mockPrismaService.personalizedFeedProgram.findMany.mockRejectedValue(
        mockError,
      );

      // エラーがスローされることを確認
      await expect(
        repository.findNotExistsPostsByPersonalizedFeedId(
          'feed1',
          mockQiitaPosts,
        ),
      ).rejects.toThrow(
        'パーソナルフィードプログラムに含まれていない記事一覧の取得に失敗しました',
      );
    });
  });
});
