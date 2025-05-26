import { ClerkJwtGuard } from '@/auth/guards/clerk-jwt.guard';
import {
  SearchQiitaPostsRequestDto,
  SearchQiitaPostsResponseDto,
} from '@/controllers/qiita-posts/dto';
import { QiitaPostsController } from '@/controllers/qiita-posts/qiita-posts.controller';
import { QiitaPostsService } from '@/domains/qiita-posts/qiita-posts.service';
import { CanActivate } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { QiitaPostFactory } from '../factories/qiita-post.factory';
import { restoreLogOutput, suppressLogOutput } from '../helpers/logger.helper';

describe('QiitaPostsController (Example)', () => {
  let controller: QiitaPostsController;
  let service: QiitaPostsService;
  let logSpies: jest.SpyInstance[];

  beforeEach(async () => {
    logSpies = suppressLogOutput();

    const mockGuard: CanActivate = { canActivate: jest.fn(() => true) };

    const mockQiitaPostsResult =
      QiitaPostFactory.createQiitaPostsSearchResult(1);

    const mockQiitaPostsService = {
      findQiitaPosts: jest.fn().mockResolvedValue(mockQiitaPostsResult),
    };

    const moduleBuilder = Test.createTestingModule({
      controllers: [QiitaPostsController],
      providers: [
        {
          provide: QiitaPostsService,
          useValue: mockQiitaPostsService,
        },
      ],
    });

    moduleBuilder.overrideGuard(ClerkJwtGuard).useValue(mockGuard);

    const module = await moduleBuilder.compile();

    controller = module.get<QiitaPostsController>(QiitaPostsController);
    service = module.get<QiitaPostsService>(QiitaPostsService);
  });

  afterEach(() => {
    restoreLogOutput(logSpies);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('searchQiitaPosts', () => {
    it('正常にQiita記事を検索できること', async () => {
      const userId = 'test-user-id';
      const requestDto = new SearchQiitaPostsRequestDto();
      requestDto.authors = ['testauthor'];
      requestDto.tags = ['JavaScript'];
      requestDto.page = 1;
      requestDto.perPage = 20;

      const result = await controller.searchQiitaPosts(requestDto, userId);

      expect(service.findQiitaPosts).toHaveBeenCalledWith(
        requestDto.authors,
        requestDto.tags,
        undefined, // minPublishedAtはundefined
        requestDto.page,
        requestDto.perPage,
      );

      expect(result).toBeInstanceOf(SearchQiitaPostsResponseDto);
      expect(result.posts).toHaveLength(1);
    });
  });
});
