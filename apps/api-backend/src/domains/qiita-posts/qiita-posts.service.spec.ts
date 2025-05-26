import { Test, TestingModule } from '@nestjs/testing';
import { QiitaPostsService } from './qiita-posts.service';
import { IQiitaPostsApiClient } from './qiita-posts.api.client.interface';
import { suppressLogOutput, restoreLogOutput } from '../../test/helpers/logger.helper';
import { QiitaPostApiResponse } from './qiita-posts.entity';

describe('QiitaPostsService', () => {
  let service: QiitaPostsService;
  let qiitaPostsApiClient: jest.Mocked<IQiitaPostsApiClient>;
  let logSpies: jest.SpyInstance[];

  beforeEach(async () => {
    logSpies = suppressLogOutput();

    const mockQiitaPostsApiClient = {
      findQiitaPosts: jest.fn(),
      findQiitaPostsByDateRange: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QiitaPostsService,
        {
          provide: 'IQiitaPostsApiClient',
          useValue: mockQiitaPostsApiClient,
        },
      ],
    }).compile();

    service = module.get<QiitaPostsService>(QiitaPostsService);
    qiitaPostsApiClient = module.get('IQiitaPostsApiClient') as jest.Mocked<IQiitaPostsApiClient>;
  });

  afterEach(() => {
    restoreLogOutput(logSpies);
  });

  describe('findQiitaPosts', () => {
    it('タグでQiita記事を検索できること', async () => {
      const tags = ['nestjs', 'typescript'];
      const mockPosts = [
        new QiitaPostApiResponse({
          id: 'post-1',
          title: 'NestJSの基本',
          rendered_body: '<p>NestJSの基本について</p>',
          body: 'NestJSの基本について',
          url: 'https://qiita.com/post-1',
          created_at: '2023-01-15T00:00:00Z',
          updated_at: '2023-01-15T00:00:00Z',
          user: {
            id: 'author-1',
            name: 'Author 1',
            description: '',
            followees_count: 0,
            followers_count: 0,
            items_count: 1,
            permanent_id: 1,
            profile_image_url: '',
            team_only: false,
          },
          comments_count: 0,
          likes_count: 10,
          reactions_count: 0,
          stocks_count: 5,
          private: false,
          tags: [{ name: 'nestjs', versions: [] }, { name: 'typescript', versions: [] }],
          coediting: false,
          group: {
            created_at: '',
            description: '',
            name: '',
            private: false,
            updated_at: '',
            url_name: '',
          },
          team_membership: {
            name: '',
          },
          slide: false,
        }),
      ];

      const mockResult = {
        posts: mockPosts,
        totalCount: mockPosts.length,
        page: 1,
        perPage: 20,
      };

      qiitaPostsApiClient.findQiitaPosts.mockResolvedValue(mockResult);

      const result = await service.findQiitaPosts(
        undefined, // authors
        tags, // tags
        undefined, // minPublishedAt
        1, // page
        20, // perPage
      );

      expect(result).toBeDefined();
      expect(result.posts).toHaveLength(1);
      expect(result.posts[0].id).toBe('post-1');
      expect(qiitaPostsApiClient.findQiitaPosts).toHaveBeenCalledWith(
        undefined,
        tags,
        undefined,
        1,
        20,
      );
    });

    it('著者でQiita記事を検索できること', async () => {
      const authors = ['author-1', 'author-2'];
      const mockPosts = [
        new QiitaPostApiResponse({
          id: 'post-1',
          title: 'NestJSの基本',
          rendered_body: '<p>NestJSの基本について</p>',
          body: 'NestJSの基本について',
          url: 'https://qiita.com/post-1',
          created_at: '2023-01-15T00:00:00Z',
          updated_at: '2023-01-15T00:00:00Z',
          user: {
            id: 'author-1',
            name: 'Author 1',
            description: '',
            followees_count: 0,
            followers_count: 0,
            items_count: 1,
            permanent_id: 1,
            profile_image_url: '',
            team_only: false,
          },
          comments_count: 0,
          likes_count: 10,
          reactions_count: 0,
          stocks_count: 5,
          private: false,
          tags: [{ name: 'nestjs', versions: [] }, { name: 'typescript', versions: [] }],
          coediting: false,
          group: {
            created_at: '',
            description: '',
            name: '',
            private: false,
            updated_at: '',
            url_name: '',
          },
          team_membership: {
            name: '',
          },
          slide: false,
        }),
      ];

      const mockResult = {
        posts: mockPosts,
        totalCount: mockPosts.length,
        page: 1,
        perPage: 20,
      };

      qiitaPostsApiClient.findQiitaPosts.mockResolvedValue(mockResult);

      const result = await service.findQiitaPosts(
        authors, // authors
        undefined, // tags
        undefined, // minPublishedAt
        1, // page
        20, // perPage
      );

      expect(result).toBeDefined();
      expect(result.posts).toHaveLength(1);
      expect(result.posts[0].id).toBe('post-1');
      expect(qiitaPostsApiClient.findQiitaPosts).toHaveBeenCalledWith(
        authors,
        undefined,
        undefined,
        1,
        20,
      );
    });

    it('公開日でQiita記事を検索できること', async () => {
      const minPublishedAt = '2023-01-01';
      const mockPosts = [
        new QiitaPostApiResponse({
          id: 'post-1',
          title: 'NestJSの基本',
          rendered_body: '<p>NestJSの基本について</p>',
          body: 'NestJSの基本について',
          url: 'https://qiita.com/post-1',
          created_at: '2023-01-15T00:00:00Z',
          updated_at: '2023-01-15T00:00:00Z',
          user: {
            id: 'author-1',
            name: 'Author 1',
            description: '',
            followees_count: 0,
            followers_count: 0,
            items_count: 1,
            permanent_id: 1,
            profile_image_url: '',
            team_only: false,
          },
          comments_count: 0,
          likes_count: 10,
          reactions_count: 0,
          stocks_count: 5,
          private: false,
          tags: [{ name: 'nestjs', versions: [] }],
          coediting: false,
          group: {
            created_at: '',
            description: '',
            name: '',
            private: false,
            updated_at: '',
            url_name: '',
          },
          team_membership: {
            name: '',
          },
          slide: false,
        }),
      ];

      const mockResult = {
        posts: mockPosts,
        totalCount: mockPosts.length,
        page: 1,
        perPage: 20,
      };

      qiitaPostsApiClient.findQiitaPosts.mockResolvedValue(mockResult);

      const result = await service.findQiitaPosts(
        undefined, // authors
        undefined, // tags
        minPublishedAt, // minPublishedAt
        1, // page
        20, // perPage
      );

      expect(result).toBeDefined();
      expect(result.posts).toHaveLength(1);
      expect(result.posts[0].id).toBe('post-1');
      expect(qiitaPostsApiClient.findQiitaPosts).toHaveBeenCalledWith(
        undefined,
        undefined,
        minPublishedAt,
        1,
        20,
      );
    });

    it('複数のパラメータでQiita記事を検索できること', async () => {
      const authors = ['author-1'];
      const tags = ['nestjs'];
      const minPublishedAt = '2023-01-01';
      const page = 2;
      const perPage = 10;
      
      const mockPosts = [
        new QiitaPostApiResponse({
          id: 'post-1',
          title: 'NestJSの基本',
          rendered_body: '<p>NestJSの基本について</p>',
          body: 'NestJSの基本について',
          url: 'https://qiita.com/post-1',
          created_at: '2023-01-15T00:00:00Z',
          updated_at: '2023-01-15T00:00:00Z',
          user: {
            id: 'author-1',
            name: 'Author 1',
            description: '',
            followees_count: 0,
            followers_count: 0,
            items_count: 1,
            permanent_id: 1,
            profile_image_url: '',
            team_only: false,
          },
          comments_count: 0,
          likes_count: 10,
          reactions_count: 0,
          stocks_count: 5,
          private: false,
          tags: [{ name: 'nestjs', versions: [] }],
          coediting: false,
          group: {
            created_at: '',
            description: '',
            name: '',
            private: false,
            updated_at: '',
            url_name: '',
          },
          team_membership: {
            name: '',
          },
          slide: false,
        }),
      ];

      const mockResult = {
        posts: mockPosts,
        totalCount: mockPosts.length,
        page,
        perPage,
      };

      qiitaPostsApiClient.findQiitaPosts.mockResolvedValue(mockResult);

      const result = await service.findQiitaPosts(
        authors,
        tags,
        minPublishedAt,
        page,
        perPage
      );

      expect(result).toBeDefined();
      expect(result.posts).toHaveLength(1);
      expect(result.posts[0].id).toBe('post-1');
      expect(qiitaPostsApiClient.findQiitaPosts).toHaveBeenCalledWith(
        authors,
        tags,
        minPublishedAt,
        page,
        perPage
      );
    });
  });
});
