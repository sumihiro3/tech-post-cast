import { AppConfigService } from '@/app-config/app-config.service';
import { ProgramScriptValidationError } from '@/types/errors';
import { IQiitaPostApiResponse } from '@domains/qiita-posts/qiita-posts.entity';
import {
  HeadlineTopicProgramScript,
  PostSummary,
} from '@domains/radio-program/headline-topic-program';
import { Test, TestingModule } from '@nestjs/testing';
import { MockFunctionMetadata, ModuleMocker } from 'jest-mock';
import { OpenAiApiClient } from './openai-api.client';

const moduleMocker = new ModuleMocker(global);

describe('OpenaiApiClient', () => {
  let service: OpenAiApiClient;
  let appConfigService: AppConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OpenAiApiClient],
    })
      .useMocker((token) => {
        // Service の各メソッドを Mock 化する
        if (token === AppConfigService) {
          return {
            // ここに Mock したいメソッドを記述する
          } as AppConfigService;
        }
        if (typeof token === 'function') {
          const mockMetadata = moduleMocker.getMetadata(
            token,
          ) as MockFunctionMetadata<any, any>;
          const Mock = moduleMocker.generateFromMetadata(mockMetadata);
          return new Mock();
        }
      })
      .compile();

    service = module.get<OpenAiApiClient>(OpenAiApiClient);
    appConfigService = module.get<AppConfigService>(AppConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(appConfigService).toBeDefined();
  });

  describe('getPostSummariesByPostId', () => {
    test('正常系：指定IDの記事要約が一つ取得できる', () => {
      const postId = 'postId';
      const postSummaries: PostSummary[] = [
        { postId: postId, title: 'title', summary: 'summary' },
        {
          postId: 'other-postId',
          title: 'other-title',
          summary: 'other-summary',
        },
      ];
      const expected = postSummaries[0];
      expect(service.getPostSummariesByPostId(postId, postSummaries)).toEqual([
        expected,
      ]);
    });
    test('正常系：指定IDの記事要約が複数取得できる', () => {
      const postId = 'postId';
      const postSummaries: PostSummary[] = [
        { postId: postId, title: 'title', summary: 'summary' },
        { postId: postId, title: 'other-title', summary: 'other-summary' },
      ];
      expect(service.getPostSummariesByPostId(postId, postSummaries)).toEqual(
        postSummaries,
      );
    });
    test('異常系：指定IDの記事要約が取得できない', () => {
      const postId = 'postId';
      const postSummaries: PostSummary[] = [
        {
          postId: 'other-postId',
          title: 'other-title',
          summary: 'other-summary',
        },
      ];
      expect(service.getPostSummariesByPostId(postId, postSummaries)).toEqual(
        [],
      );
    });
  });

  describe('getLongestPostSummary', () => {
    test('正常系：最も長い記事要約が取得できる', () => {
      const postSummaries: PostSummary[] = [
        { postId: 'postId', title: 'title', summary: 'summary' },
        {
          postId: 'postId',
          title: 'title',
          summary: 'longest-summary',
        },
      ];
      const expected = postSummaries[1];
      expect(service.getLongestPostSummary(postSummaries)).toEqual(expected);
    });
    test('正常系：記事要約の長さがすべて同じの場合は、最初のものが取得できる', () => {
      const postSummaries: PostSummary[] = [
        { postId: 'postId', title: 'title1', summary: 'summary' },
        { postId: 'postId', title: 'title2', summary: 'summary' },
      ];
      const expected = postSummaries[0];
      expect(service.getLongestPostSummary(postSummaries)).toEqual(expected);
    });
  });

  describe('validateHeadlineTopicProgramScript', () => {
    test('正常系：台本が正しい場合、戻り値としてそのまま返る', () => {
      // setup
      const postId = 'postId';
      const posts: IQiitaPostApiResponse[] = [createDummyQiitaPost(postId)];
      const script: HeadlineTopicProgramScript = {
        title: 'title',
        intro: 'intro',
        posts: [{ postId, title: 'title', summary: 'summary' }],
        ending: 'ending',
      };
      // run
      const result = service.validateHeadlineTopicProgramScript(script, posts);
      // verify
      expect(result).toEqual(script);
    });
    test('異常系：台本が空の場合、エラーが返る', () => {
      // setup
      const postId = 'postId';
      const posts: IQiitaPostApiResponse[] = [createDummyQiitaPost(postId)];
      const script: HeadlineTopicProgramScript = undefined;
      // run
      try {
        service.validateHeadlineTopicProgramScript(script, posts);
        fail('エラーが発生しませんでした');
      } catch (error) {
        // verify
        expect(error).toBeInstanceOf(ProgramScriptValidationError);
      }
    });
    test('正常系：生成された台本に存在しない記事ID が含まれている場合、その記事は無視される', () => {
      // setup
      const postId = 'postId';
      const posts: IQiitaPostApiResponse[] = [createDummyQiitaPost(postId)];
      const script: HeadlineTopicProgramScript = {
        title: 'title',
        intro: 'intro',
        posts: [
          { postId, title: 'title', summary: 'summary' },
          { postId: 'unknown-postId', title: 'title', summary: 'summary' },
        ],
        ending: 'ending',
      };
      // run
      const result = service.validateHeadlineTopicProgramScript(script, posts);
      // verify
      expect(result.posts.length).toBe(1);
      expect(result.posts[0].postId).toBe(postId);
    });
    test('異常系：生成された台本に指定の記事IDが存在しない場合、エラーが返る', () => {
      // setup
      const postId = 'postId';
      const posts: IQiitaPostApiResponse[] = [createDummyQiitaPost(postId)];
      const script: HeadlineTopicProgramScript = {
        title: 'title',
        intro: 'intro',
        posts: [
          { postId: 'other-postId', title: 'title', summary: 'summary' },
          { postId: 'other-other-postId', title: 'title', summary: 'summary' },
        ],
        ending: 'ending',
      };
      // run
      try {
        service.validateHeadlineTopicProgramScript(script, posts);
        fail('エラーが発生しませんでした');
      } catch (error) {
        // verify
        expect(error).toBeInstanceOf(ProgramScriptValidationError);
      }
    });
    test('正常系：生成された台本に指定の記事IDが複数存在する場合、要約文が長いほうが返る', () => {
      // setup
      const postId = 'postId';
      const otherPostId = 'other-postId';
      const posts: IQiitaPostApiResponse[] = [
        createDummyQiitaPost(postId),
        createDummyQiitaPost(otherPostId),
      ];
      const postSummaries: PostSummary[] = [
        { postId, title: 'title', summary: 'summary' },
        { postId: otherPostId, title: 'title', summary: 'other-summary' },
        { postId, title: 'title', summary: 'longest-summary' },
      ];
      const script: HeadlineTopicProgramScript = {
        title: 'title',
        intro: 'intro',
        posts: postSummaries,
        ending: 'ending',
      };
      // run
      const result = service.validateHeadlineTopicProgramScript(script, posts);
      // verify
      const resultPosts = result.posts;
      expect(resultPosts.length).toBe(2);
      expect(result.posts[0].postId).toBe(postId);
      expect(result.posts[0]).toBe(postSummaries[2]);
      expect(result.posts[1].postId).toBe(otherPostId);
      expect(result.posts[1]).toBe(postSummaries[1]);
    });
  });
});

/**
 * 指定した記事IDのダミーの QiitaPostApiResponse を生成する
 * @param postId 記事ID
 * @returns QiitaPostApiResponse のダミーデータ
 */
function createDummyQiitaPost(postId: string): IQiitaPostApiResponse {
  return {
    id: postId,
    title: `${postId}-title`,
    rendered_body: 'rendered_body',
    body: 'body',
    url: 'url',
    created_at: 'created_at',
    updated_at: 'updated_at',
    user: {
      id: 'userId',
      followees_count: 1,
      followers_count: 1,
      items_count: 1,
      permanent_id: 1,
      profile_image_url: 'profile_image_url',
      team_only: false,
    },
    comments_count: 1,
    likes_count: 1,
    reactions_count: 1,
    stocks_count: 1,
    private: false,
    tags: [],
    coediting: false,
    group: {
      created_at: 'created_at',
      updated_at: 'updated_at',
      name: 'group-name',
      private: false,
      url_name: 'url_name',
      description: 'group-description',
    },
    page_views_count: 1,
    team_membership: {
      name: 'role-name',
    },
    organization_url_name: 'organization_url_name',
    slide: false,
    summary: 'summary',
  };
}
