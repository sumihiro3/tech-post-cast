import { AppConfigService } from '@/app-config/app-config.service';
import { QiitaPostApiResponse } from '@/domains/qiita-posts/qiita-posts.entity';
import { Test, TestingModule } from '@nestjs/testing';
import axios from 'axios';
import { QiitaPostsApiClient } from './qiita-posts.api.client';

// axiosをモック化
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('QiitaPostsApiClient', () => {
  let client: QiitaPostsApiClient;
  let appConfigService: AppConfigService;

  // モックレスポンスの作成
  const mockResponse = {
    data: [
      {
        id: 'test-post-1',
        title: 'テスト記事1',
        body: 'テスト記事の本文1',
        rendered_body: '<p>テスト記事の本文1</p>',
        url: 'https://qiita.com/test/items/test-post-1',
        created_at: '2023-01-01T00:00:00+09:00',
        updated_at: '2023-01-01T00:00:00+09:00',
        user: {
          id: 'test-user',
          profile_image_url: 'https://example.com/image.png',
        },
        comments_count: 5,
        likes_count: 10,
        reactions_count: 0,
        stocks_count: 15,
        private: false,
        tags: [{ name: 'JavaScript', versions: [] }],
        coediting: false,
        group: null,
        team_membership: null,
        slide: false,
      },
      {
        id: 'test-post-2',
        title: 'テスト記事2',
        body: 'テスト記事の本文2',
        rendered_body: '<p>テスト記事の本文2</p>',
        url: 'https://qiita.com/test/items/test-post-2',
        created_at: '2023-01-02T00:00:00+09:00',
        updated_at: '2023-01-02T00:00:00+09:00',
        user: {
          id: 'test-user',
          profile_image_url: 'https://example.com/image.png',
        },
        comments_count: 3,
        likes_count: 7,
        reactions_count: 0,
        stocks_count: 12,
        private: false,
        tags: [{ name: 'TypeScript', versions: [] }],
        coediting: false,
        group: null,
        team_membership: null,
        slide: false,
      },
    ],
    headers: {
      'total-count': '42',
    },
    status: 200,
    statusText: 'OK',
    config: {},
  };

  // APIクライアントのモック
  const mockApiClient = {
    get: jest.fn().mockResolvedValue(mockResponse),
  };

  beforeEach(async () => {
    // ConfigServiceのモック
    const mockAppConfigService = {
      QiitaAccessToken: 'mock-token',
    };

    // axiosのcreateメソッドをモック化
    mockedAxios.create.mockReturnValue(mockApiClient as any);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QiitaPostsApiClient,
        {
          provide: AppConfigService,
          useValue: mockAppConfigService,
        },
      ],
    }).compile();

    client = module.get<QiitaPostsApiClient>(QiitaPostsApiClient);
    appConfigService = module.get<AppConfigService>(AppConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(client).toBeDefined();
  });

  describe('getApiClient', () => {
    it('APIクライアントを初期化して返すこと', () => {
      const apiClient = client.getApiClient();

      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://qiita.com/api/v2',
        responseType: 'json',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-token',
        },
      });

      expect(apiClient).toBe(mockApiClient);
    });

    it('2回目以降の呼び出しでは初期化済みのクライアントを返すこと', () => {
      client.getApiClient(); // 1回目の呼び出し
      client.getApiClient(); // 2回目の呼び出し

      // axiosのcreateは1回だけ呼ばれることを確認
      expect(mockedAxios.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('findQiitaPosts', () => {
    it('デフォルトパラメータで正常に記事を検索できること', async () => {
      const result = await client.findQiitaPosts();

      // APIリクエストの検証
      expect(mockApiClient.get).toHaveBeenCalledWith('/items', {
        params: {
          query: '',
          page: 1,
          per_page: 20,
        },
      });

      // 戻り値の検証
      expect(result.posts).toHaveLength(2);
      expect(result.totalCount).toBe(42);
      expect(result.page).toBe(1);
      expect(result.perPage).toBe(20);
      expect(result.posts[0]).toBeInstanceOf(QiitaPostApiResponse);
      expect(result.posts[0].id).toBe('test-post-1');
      expect(result.posts[1].id).toBe('test-post-2');
    });

    it('著者とタグを指定して検索できること', async () => {
      const authors = ['author1', 'author2'];
      const tags = ['tag1', 'tag2'];

      await client.findQiitaPosts(authors, tags);

      // 検索クエリの構築が正しいことを検証
      expect(mockApiClient.get).toHaveBeenCalledWith('/items', {
        params: {
          query: 'user:author1,author2 tag:tag1,tag2',
          page: 1,
          per_page: 20,
        },
      });
    });

    it('公開日の最小値を指定して検索できること', async () => {
      const minPublishedAt = '2023-01-01';

      await client.findQiitaPosts(undefined, undefined, minPublishedAt);

      // 検索クエリの構築が正しいことを検証
      expect(mockApiClient.get).toHaveBeenCalledWith('/items', {
        params: {
          query: 'created:>=2023-01-01',
          page: 1,
          per_page: 20,
        },
      });
    });

    it('すべてのパラメータを指定して検索できること', async () => {
      const authors = ['author1'];
      const tags = ['tag1'];
      const minPublishedAt = '2023-01-01';
      const page = 2;
      const perPage = 30;

      await client.findQiitaPosts(authors, tags, minPublishedAt, page, perPage);

      // 検索クエリの構築が正しいことを検証
      expect(mockApiClient.get).toHaveBeenCalledWith('/items', {
        params: {
          query: 'user:author1 tag:tag1 created:>=2023-01-01',
          page: 2,
          per_page: 30,
        },
      });
    });
  });

  describe('findQiitaPostsByDateRange', () => {
    it('指定期間内の記事を取得できること', async () => {
      // 2ページ目のレスポンスを準備
      const mockResponsePage2 = {
        ...mockResponse,
        data: [
          {
            id: 'test-post-3',
            title: 'テスト記事3',
            body: 'テスト記事の本文3',
            rendered_body: '<p>テスト記事の本文3</p>',
            url: 'https://qiita.com/test/items/test-post-3',
            created_at: '2023-01-03T00:00:00+09:00',
            updated_at: '2023-01-03T00:00:00+09:00',
            user: {
              id: 'test-user',
              profile_image_url: 'https://example.com/image.png',
            },
            comments_count: 1,
            likes_count: 2,
            reactions_count: 0,
            stocks_count: 3,
            private: false,
            tags: [{ name: 'JavaScript', versions: [] }],
            coediting: false,
            group: null,
            team_membership: null,
            slide: false,
          },
        ],
        headers: {
          'total-count': '42',
        },
      };

      // 1ページ目と2ページ目のレスポンスが正しく返されるようにモック設定
      // 1ページ目のレスポンスでは、maxPageを2に設定するために、total-countが十分に大きな値になるよう設定
      const mockResponsePage1 = {
        ...mockResponse,
        headers: {
          'total-count': '150', // 100件/ページで2ページになるように設定
        },
      };

      mockApiClient.get
        .mockResolvedValueOnce(mockResponsePage1)
        .mockResolvedValueOnce(mockResponsePage2);

      const from = new Date('2023-01-01');
      const to = new Date('2023-01-31');

      const result = await client.findQiitaPostsByDateRange(from, to);

      // APIリクエストの検証
      expect(mockApiClient.get).toHaveBeenCalledTimes(2); // 2ページ分呼ばれる
      expect(mockApiClient.get).toHaveBeenNthCalledWith(1, '/items', {
        params: {
          query: 'created:>=2023-01-01 created:<=2023-01-31',
          page: 1,
          per_page: 100,
        },
      });
      expect(mockApiClient.get).toHaveBeenNthCalledWith(2, '/items', {
        params: {
          query: 'created:>=2023-01-01 created:<=2023-01-31',
          page: 2,
          per_page: 100,
        },
      });

      // 戻り値の検証
      expect(result).toHaveLength(3); // 2ページ分の記事を合わせて3つ
      expect(result[0]).toBeInstanceOf(QiitaPostApiResponse);
      expect(result[0].id).toBe('test-post-1');
      expect(result[1].id).toBe('test-post-2');
      expect(result[2].id).toBe('test-post-3');
    });
  });

  describe('エラーハンドリング', () => {
    it('APIからエラーが返された場合は適切にエラーをスローすること', async () => {
      // 明示的にPromiseを拒否するエラーオブジェクトを作成
      const mockError = new Error('API Error');

      // APIクライアントのgetメソッドを上書きして、エラーをスローするように設定
      const originalGet = mockApiClient.get;
      mockApiClient.get = jest.fn().mockImplementation(() => {
        throw mockError;
      });

      // エラーがスローされることを検証
      try {
        await client.findQiitaPosts();
        // エラーがスローされなかった場合は、テストを失敗させる
        fail('エラーがスローされるべきでした');
      } catch (error) {
        expect(error).toBe(mockError);
      }

      // 後続のテストに影響しないよう、元のモックに戻す
      mockApiClient.get = originalGet;
    });
  });
});
