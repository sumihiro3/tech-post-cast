import { QiitaPostsService } from '@/domains/qiita-posts/qiita-posts.service';
import { Test, TestingModule } from '@nestjs/testing';
import { SearchQiitaPostsRequestDto, SearchQiitaPostsResponseDto } from './dto';
import { QiitaPostsController } from './qiita-posts.controller';

describe('QiitaPostsController', () => {
  let controller: QiitaPostsController;
  let service: QiitaPostsService;

  // モックデータ
  const mockQiitaPostsResult = {
    posts: [
      {
        id: 'test-post-1',
        title: 'テスト記事1',
        url: 'https://qiita.com/test/items/test-post-1',
        created_at: '2023-01-01T00:00:00+09:00',
        updated_at: '2023-01-01T00:00:00+09:00',
        user: {
          id: 'test-user',
          profile_image_url: 'https://example.com/image.png',
        },
        comments_count: 5,
        likes_count: 10,
        stocks_count: 15,
        tags: [{ name: 'JavaScript', versions: [] }],
      },
    ],
    totalCount: 1,
    page: 1,
    perPage: 20,
  };

  beforeEach(async () => {
    // モックサービスの作成
    const mockQiitaPostsService = {
      findQiitaPosts: jest.fn().mockResolvedValue(mockQiitaPostsResult),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [QiitaPostsController],
      providers: [
        {
          provide: QiitaPostsService,
          useValue: mockQiitaPostsService,
        },
      ],
    }).compile();

    controller = module.get<QiitaPostsController>(QiitaPostsController);
    service = module.get<QiitaPostsService>(QiitaPostsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('searchQiitaPosts', () => {
    it('正常にQiita記事を検索できること', async () => {
      // リクエストDTOの作成
      const requestDto = new SearchQiitaPostsRequestDto();
      requestDto.authors = ['testauthor'];
      requestDto.tags = ['JavaScript'];
      requestDto.page = 1;
      requestDto.perPage = 20;

      // コントローラーを呼び出し
      const result = await controller.searchQiitaPosts(requestDto);

      // サービスが正しいパラメータで呼び出されたことを検証
      expect(service.findQiitaPosts).toHaveBeenCalledWith(
        requestDto.authors,
        requestDto.tags,
        undefined, // minPublishedAtはundefined
        requestDto.page,
        requestDto.perPage,
      );

      // 結果が期待通りであることを検証
      expect(result).toBeInstanceOf(SearchQiitaPostsResponseDto);
      expect(result.posts).toHaveLength(1);
      expect(result.totalCount).toBe(1);
      expect(result.page).toBe(1);
      expect(result.perPage).toBe(20);
    });

    it('日付パラメータありで正常に検索できること', async () => {
      // リクエストDTOの作成
      const requestDto = new SearchQiitaPostsRequestDto();
      requestDto.authors = ['testauthor'];
      requestDto.minPublishedAt = new Date('2023-01-01');

      // コントローラーを呼び出し
      await controller.searchQiitaPosts(requestDto);

      // サービスが正しいパラメータで呼び出されたことを検証
      expect(service.findQiitaPosts).toHaveBeenCalledWith(
        requestDto.authors,
        undefined, // tagsはundefined
        '2023-01-01', // 日付フォーマット確認
        1, // デフォルト値
        20, // デフォルト値
      );
    });
  });
});
