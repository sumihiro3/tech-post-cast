import { AppConfigService } from '@/app-config/app-config.service';
import { Test, TestingModule } from '@nestjs/testing';
import axios, { AxiosError } from 'axios';
import { QiitaPostsApiClient } from './qiita-posts.api.client';

// モックの設定
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('QiitaPostsApiClient', () => {
  let service: QiitaPostsApiClient;
  let appConfig: AppConfigService;

  // テスト用のモックデータ
  const mockQiitaPost = {
    rendered_body: 'テスト記事本文',
    body: 'テスト記事本文',
    coediting: false,
    comments_count: 0,
    created_at: '2024-03-20T10:00:00+09:00',
    group: null,
    id: 'test-post-id',
    likes_count: 0,
    private: false,
    reactions_count: 0,
    tags: [{ name: 'test', versions: [] }],
    title: 'テスト記事',
    updated_at: '2024-03-20T10:00:00+09:00',
    url: 'https://qiita.com/test/items/test-post-id',
    user: {
      description: 'テストユーザー',
      facebook_id: '',
      followees_count: 0,
      followers_count: 0,
      github_login_name: '',
      id: 'test-user',
      items_count: 1,
      linkedin_id: '',
      location: '',
      name: 'テストユーザー',
      organization: '',
      permanent_id: 1,
      profile_image_url: 'https://example.com/image.png',
      team_only: false,
      twitter_screen_name: '',
      website_url: '',
    },
    page_views_count: 0,
    team_membership: null,
  };

  beforeEach(async () => {
    // Arrange - テスト環境のセットアップ
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QiitaPostsApiClient,
        {
          provide: AppConfigService,
          useValue: {
            QiitaAccessToken: 'test-token',
          },
        },
      ],
    }).compile();

    service = module.get<QiitaPostsApiClient>(QiitaPostsApiClient);
    appConfig = module.get<AppConfigService>(AppConfigService);

    // axiosのcreateメソッドのモックを設定
    mockedAxios.create.mockReturnValue({
      get: jest.fn(),
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getApiClient', () => {
    it('APIクライアントが正しい設定で作成されること', () => {
      // Act - APIクライアントを取得
      service.getApiClient();

      // Assert - 正しいパラメータでaxios.createが呼ばれたか確認
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://qiita.com/api/v2',
        responseType: 'json',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
      });
    });

    it('APIクライアントが一度作成された後は同じインスタンスを返すこと', () => {
      // Arrange - 最初のクライアント取得とモッククリア
      const firstClient = service.getApiClient();
      mockedAxios.create.mockClear();

      // Act - 2回目のクライアント取得
      const secondClient = service.getApiClient();

      // Assert - 同じインスタンスが返されaxios.createが再度呼ばれないこと
      expect(firstClient).toBe(secondClient);
      expect(mockedAxios.create).not.toHaveBeenCalled();
    });
  });

  describe('findQiitaPostsByDateRange', () => {
    it('日付範囲に基づいて投稿を取得できること', async () => {
      // Arrange - モックレスポンスの設定
      const mockResponse = {
        data: [mockQiitaPost],
        headers: {
          'total-count': '1',
        },
      };

      const apiClient = service.getApiClient();
      (apiClient.get as jest.Mock).mockResolvedValueOnce(mockResponse);

      const from = new Date('2024-03-20');
      const to = new Date('2024-03-21');

      // Act - 日付範囲での投稿取得
      const result = await service.findQiitaPostsByDateRange(from, to);

      // Assert - 結果の検証
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('テスト記事');
      expect(apiClient.get).toHaveBeenCalledWith('/items', {
        params: {
          query: 'created:>=2024-03-20 created:<=2024-03-21',
          page: 1,
          per_page: 100,
        },
      });
    });
  });

  describe('findQiitaPostsByPage', () => {
    it('特定のページの投稿を取得できること', async () => {
      // Arrange - モックレスポンスの設定
      const mockResponse = {
        data: [mockQiitaPost],
        headers: {
          'total-count': '1',
        },
      };

      const apiClient = service.getApiClient();
      (apiClient.get as jest.Mock).mockResolvedValueOnce(mockResponse);

      // Act - ページ指定での投稿取得
      const result = await service.findQiitaPostsByPage('test query', 1);

      // Assert - 結果の検証
      expect(result.posts).toHaveLength(1);
      expect(result.currentPage).toBe(1);
      expect(result.maxPage).toBe(1);
      expect(apiClient.get).toHaveBeenCalledWith('/items', {
        params: {
          query: 'test query',
          page: 1,
          per_page: 100,
        },
      });
    });

    it('APIエラーを適切に処理できること', async () => {
      // Arrange - APIエラーのモック設定
      const apiClient = service.getApiClient();

      const mockError = {
        isAxiosError: true,
        name: 'AxiosError',
        message: 'Request failed with status code 400',
        code: 'ERR_BAD_REQUEST',
        response: {
          data: { message: 'Bad Request' },
          status: 400,
          statusText: 'Bad Request',
          headers: {},
          config: {} as any,
        },
      } as AxiosError;

      (apiClient.get as jest.Mock).mockRejectedValueOnce(mockError);

      // Act & Assert - エラーが適切に伝播することを検証
      await expect(
        service.findQiitaPostsByPage('test query', 1),
      ).rejects.toMatchObject({
        isAxiosError: true,
        message: 'Request failed with status code 400',
        code: 'ERR_BAD_REQUEST',
      });
    });

    it('レート制限エラーを適切に処理できること', async () => {
      // Arrange - レート制限エラーのモック設定
      const apiClient = service.getApiClient();

      const mockError = {
        isAxiosError: true,
        name: 'AxiosError',
        message: 'Request failed with status code 429',
        code: 'ERR_BAD_REQUEST',
        response: {
          data: { message: 'Rate Limited' },
          status: 429,
          statusText: 'Too Many Requests',
          headers: {},
          config: {} as any,
        },
      } as AxiosError;

      (apiClient.get as jest.Mock).mockRejectedValueOnce(mockError);

      // Act & Assert - レート制限エラーが適切に伝播することを検証
      await expect(
        service.findQiitaPostsByPage('test query', 1),
      ).rejects.toMatchObject({
        isAxiosError: true,
        message: 'Request failed with status code 429',
      });
    });
  });

  describe('findQiitaPostsByPersonalizedFeed', () => {
    it('日付範囲フィルターを使用して投稿を取得できること', async () => {
      // Arrange - モックレスポンスの設定
      const mockResponse = {
        data: [mockQiitaPost],
        headers: {
          'total-count': '1',
        },
      };

      const apiClient = service.getApiClient();
      (apiClient.get as jest.Mock).mockResolvedValueOnce(mockResponse);

      // Act - パーソナライズフィード検索の実行
      const result = await service.findQiitaPostsByPersonalizedFeed({
        dateRangeFilter: {
          from: new Date('2024-03-20'),
          to: new Date('2024-03-21'),
        },
        targetDate: new Date('2024-05-04'),
      });

      // Assert - 結果の検証
      expect(result.posts).toHaveLength(1);
      expect(result.posts[0].title).toBe('テスト記事');
      expect(apiClient.get).toHaveBeenCalledWith('/items', {
        params: {
          query: 'created:>=2024-03-20 created:<=2024-03-21',
          page: 1,
          per_page: 100,
        },
      });
    });

    it('daysAgoパラメータを使用して投稿を取得できること', async () => {
      // Arrange - モックレスポンスの設定
      const mockResponse = {
        data: [mockQiitaPost],
        headers: {
          'total-count': '1',
        },
      };

      const apiClient = service.getApiClient();
      (apiClient.get as jest.Mock).mockResolvedValueOnce(mockResponse);

      // 現在日時を固定
      const realDate = global.Date;
      const mockDate = new Date('2024-05-04');
      global.Date = jest.fn(() => mockDate) as any;

      // Act - パーソナライズフィード検索の実行（daysAgo指定）
      const result = await service.findQiitaPostsByPersonalizedFeed({
        dateRangeFilter: {
          daysAgo: 7,
        },
        targetDate: mockDate,
      });

      // Dateをリセット
      global.Date = realDate;

      // Assert - 結果の検証
      expect(result.posts).toHaveLength(1);
      expect(apiClient.get).toHaveBeenCalledWith('/items', {
        params: {
          query: 'created:>=2024-04-27 created:<=2024-05-04',
          page: 1,
          per_page: 100,
        },
      });
    });

    it('タグフィルターを使用して投稿を取得できること（OR条件）', async () => {
      // Arrange - モックレスポンスの設定
      const mockResponse = {
        data: [mockQiitaPost],
        headers: {
          'total-count': '1',
        },
      };

      const apiClient = service.getApiClient();
      (apiClient.get as jest.Mock).mockResolvedValueOnce(mockResponse);

      // Act - パーソナライズフィード検索の実行
      const result = await service.findQiitaPostsByPersonalizedFeed({
        tagFilters: [
          {
            tagNames: ['javascript', 'typescript'],
            logicType: 'OR',
          },
        ],
      });

      // Assert - 結果の検証
      expect(result.posts).toHaveLength(1);
      expect(apiClient.get).toHaveBeenCalledWith('/items', {
        params: {
          query: 'tag:javascript,typescript',
          page: 1,
          per_page: 100,
        },
      });
    });

    it('タグフィルターを使用して投稿を取得できること（AND条件）', async () => {
      // Arrange - モックレスポンスの設定
      const mockResponse = {
        data: [mockQiitaPost],
        headers: {
          'total-count': '1',
        },
      };

      const apiClient = service.getApiClient();
      (apiClient.get as jest.Mock).mockResolvedValueOnce(mockResponse);

      // Act - パーソナライズフィード検索の実行（論理演算子は無視される）
      const result = await service.findQiitaPostsByPersonalizedFeed({
        tagFilters: [
          {
            tagNames: ['javascript', 'typescript'],
            logicType: 'AND',
          },
        ],
      });

      // Assert - 結果の検証
      expect(result.posts).toHaveLength(1);
      expect(apiClient.get).toHaveBeenCalledWith('/items', {
        params: {
          query: 'tag:javascript,typescript',
          page: 1,
          per_page: 100,
        },
      });
    });

    it('著者フィルターを使用して投稿を取得できること', async () => {
      // Arrange - モックレスポンスの設定
      const mockResponse = {
        data: [mockQiitaPost],
        headers: {
          'total-count': '1',
        },
      };

      const apiClient = service.getApiClient();
      (apiClient.get as jest.Mock).mockResolvedValueOnce(mockResponse);

      // Act - パーソナライズフィード検索の実行
      const result = await service.findQiitaPostsByPersonalizedFeed({
        authorFilters: [
          {
            authorIds: ['user1', 'user2'],
            logicType: 'OR',
          },
        ],
      });

      // Assert - 結果の検証
      expect(result.posts).toHaveLength(1);
      expect(apiClient.get).toHaveBeenCalledWith('/items', {
        params: {
          query: 'user:user1,user2',
          page: 1,
          per_page: 100,
        },
      });
    });

    it('複数のフィルター条件を組み合わせて投稿を取得できること', async () => {
      // Arrange - モックレスポンスの設定
      const mockResponse = {
        data: [mockQiitaPost],
        headers: {
          'total-count': '1',
        },
      };

      const apiClient = service.getApiClient();
      (apiClient.get as jest.Mock).mockResolvedValueOnce(mockResponse);

      // Act - パーソナライズフィード検索の実行
      const result = await service.findQiitaPostsByPersonalizedFeed({
        dateRangeFilter: {
          from: new Date('2024-03-20'),
          to: new Date('2024-03-21'),
        },
        tagFilters: [
          {
            tagNames: ['javascript', 'typescript'],
            logicType: 'OR',
          },
        ],
        authorFilters: [
          {
            authorIds: ['user1'],
            logicType: 'OR',
          },
        ],
      });

      // Assert - 結果の検証
      expect(result.posts).toHaveLength(1);
      expect(apiClient.get).toHaveBeenCalledWith('/items', {
        params: {
          query:
            'created:>=2024-03-20 created:<=2024-03-21 tag:javascript,typescript user:user1',
          page: 1,
          per_page: 100,
        },
      });
    });

    it('フィルター条件がない場合は空の配列を返すこと', async () => {
      // Act - 空のオプションでパーソナライズフィード検索の実行
      const result = await service.findQiitaPostsByPersonalizedFeed({});

      // Assert - 結果の検証
      expect(result.posts).toHaveLength(0);
      expect(service.getApiClient().get).not.toHaveBeenCalled();
    });

    it('ページネーションパラメータを適切に処理できること', async () => {
      // Arrange - 複数ページのモックレスポンスを設定
      const mockResponse1 = {
        data: [mockQiitaPost],
        headers: {
          'total-count': '3',
        },
      };
      const mockResponse2 = {
        data: [{ ...mockQiitaPost, id: 'test-post-id-2' }],
        headers: {
          'total-count': '3',
        },
      };
      const mockResponse3 = {
        data: [{ ...mockQiitaPost, id: 'test-post-id-3' }],
        headers: {
          'total-count': '3',
        },
      };

      const apiClient = service.getApiClient();
      (apiClient.get as jest.Mock)
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2)
        .mockResolvedValueOnce(mockResponse3);

      // Act - パーソナライズフィード検索の実行（ページサイズ1指定）
      const result = await service.findQiitaPostsByPersonalizedFeed({
        tagFilters: [{ tagNames: ['javascript'], logicType: 'OR' }],
        perPage: 1,
      });

      // Assert - 結果の検証
      expect(result.posts).toHaveLength(3);
      expect(apiClient.get).toHaveBeenCalledTimes(3);
      expect(apiClient.get).toHaveBeenNthCalledWith(1, '/items', {
        params: {
          query: 'tag:javascript',
          page: 1,
          per_page: 1,
        },
      });
      expect(apiClient.get).toHaveBeenNthCalledWith(2, '/items', {
        params: {
          query: 'tag:javascript',
          page: 2,
          per_page: 1,
        },
      });
      expect(apiClient.get).toHaveBeenNthCalledWith(3, '/items', {
        params: {
          query: 'tag:javascript',
          page: 3,
          per_page: 1,
        },
      });
    });
  });

  describe('findQiitaPostsByTags', () => {
    it('指定したタグを含む投稿をOR条件で取得できること（デフォルト）', async () => {
      // Arrange - モックレスポンスの設定
      const mockResponse = {
        data: [mockQiitaPost],
        headers: {
          'total-count': '1',
        },
      };

      const apiClient = service.getApiClient();
      (apiClient.get as jest.Mock).mockResolvedValueOnce(mockResponse);

      // findQiitaPostsByPersonalizedFeedメソッドをスパイ
      const spy = jest.spyOn(service, 'findQiitaPostsByPersonalizedFeed');

      // Act - タグ検索の実行
      const result = await service.findQiitaPostsByTags([
        'javascript',
        'typescript',
      ]);

      // Assert - 結果の検証
      expect(result.posts).toHaveLength(1);
      expect(spy).toHaveBeenCalledWith({
        tagFilters: [
          {
            tagNames: ['javascript', 'typescript'],
            logicType: 'OR',
          },
        ],
      });
    });

    it('指定したタグを含む投稿をAND条件で取得できること', async () => {
      // Arrange - モックレスポンスの設定
      const mockResponse = {
        data: [mockQiitaPost],
        headers: {
          'total-count': '1',
        },
      };

      const apiClient = service.getApiClient();
      (apiClient.get as jest.Mock).mockResolvedValueOnce(mockResponse);

      // findQiitaPostsByPersonalizedFeedメソッドをスパイ
      const spy = jest.spyOn(service, 'findQiitaPostsByPersonalizedFeed');

      // Act - タグ検索の実行（AND条件）
      const result = await service.findQiitaPostsByTags(
        ['javascript', 'typescript'],
        'AND',
      );

      // Assert - 結果の検証
      expect(result.posts).toHaveLength(1);
      expect(spy).toHaveBeenCalledWith({
        tagFilters: [
          {
            tagNames: ['javascript', 'typescript'],
            logicType: 'AND',
          },
        ],
      });
    });
  });

  describe('findQiitaPostsByAuthors', () => {
    it('指定した著者の投稿を取得できること', async () => {
      // Arrange - モックレスポンスの設定
      const mockResponse = {
        data: [mockQiitaPost],
        headers: {
          'total-count': '1',
        },
      };

      const apiClient = service.getApiClient();
      (apiClient.get as jest.Mock).mockResolvedValueOnce(mockResponse);

      // findQiitaPostsByPersonalizedFeedメソッドをスパイ
      const spy = jest.spyOn(service, 'findQiitaPostsByPersonalizedFeed');

      // Act - 著者検索の実行
      const result = await service.findQiitaPostsByAuthors(['user1', 'user2']);

      // Assert - 結果の検証
      expect(result.posts).toHaveLength(1);
      expect(spy).toHaveBeenCalledWith({
        authorFilters: [
          {
            authorIds: ['user1', 'user2'],
            logicType: 'OR',
          },
        ],
      });
    });
  });
});
