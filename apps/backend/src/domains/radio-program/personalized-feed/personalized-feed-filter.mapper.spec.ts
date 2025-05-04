import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PersonalizedFeedWithFilters } from '@tech-post-cast/database';
import * as dayjs from 'dayjs';
import { PersonalizedFeedFilterMapper } from './personalized-feed-filter.mapper';

// 日付フォーマットの定数（テスト用に抽出）
const DATE_FORMAT = 'YYYY-MM-DD';

describe('PersonalizedFeedFilterMapper', () => {
  let mapper: PersonalizedFeedFilterMapper;
  // オリジナルのdayjsメソッドを保存
  let originalDayjs: typeof dayjs;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PersonalizedFeedFilterMapper],
    }).compile();

    mapper = module.get<PersonalizedFeedFilterMapper>(
      PersonalizedFeedFilterMapper,
    );
    // ロガーをモック化して不要なログを抑制
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);

    // オリジナルのdayjsを保存
    originalDayjs = dayjs;
  });

  afterEach(() => {
    // テスト後にモックをリセット
    jest.restoreAllMocks();
    // dayjsの振る舞いを元に戻す
    (global as any).dayjs = originalDayjs;
  });

  describe('buildQiitaFilterOptions', () => {
    it('空のフィルター設定から正しいオプションを生成する', () => {
      // 指定したフィードの構造とマッチするようにモックを作成
      const feedWithEmptyFilters = {
        id: 'feed_123',
        name: 'テストフィード',
        filterGroups: [],
      } as PersonalizedFeedWithFilters;

      const result = mapper.buildQiitaFilterOptions(feedWithEmptyFilters);

      expect(result).toEqual({
        tagFilters: [],
        authorFilters: [],
        perPage: 100,
        page: 1,
      });
    });

    it('タグフィルターが含まれる場合、正しいオプションを生成する', () => {
      const feedWithTagFilter = {
        id: 'feed_123',
        name: 'テストフィード',
        filterGroups: [
          {
            id: 'group_1',
            filterId: 'feed_123',
            name: 'タググループ',
            logicType: 'AND',
            tagFilters: [
              {
                id: 'tag_1',
                groupId: 'group_1',
                tagName: 'JavaScript',
                createdAt: new Date(),
              },
              {
                id: 'tag_2',
                groupId: 'group_1',
                tagName: 'TypeScript',
                createdAt: new Date(),
              },
            ],
            authorFilters: [],
          },
        ],
      } as unknown as PersonalizedFeedWithFilters;

      const result = mapper.buildQiitaFilterOptions(feedWithTagFilter);

      expect(result).toEqual({
        tagFilters: [
          {
            tagNames: ['JavaScript', 'TypeScript'],
            logicType: 'AND',
          },
        ],
        authorFilters: [],
        perPage: 100,
        page: 1,
      });
    });

    it('著者フィルターが含まれる場合、正しいオプションを生成する', () => {
      const feedWithAuthorFilter = {
        id: 'feed_123',
        name: 'テストフィード',
        filterGroups: [
          {
            id: 'group_1',
            filterId: 'feed_123',
            name: '著者グループ',
            logicType: 'OR',
            tagFilters: [],
            authorFilters: [
              {
                id: 'author_1',
                groupId: 'group_1',
                authorId: 'user1',
                createdAt: new Date(),
              },
              {
                id: 'author_2',
                groupId: 'group_1',
                authorId: 'user2',
                createdAt: new Date(),
              },
            ],
          },
        ],
      } as unknown as PersonalizedFeedWithFilters;

      const result = mapper.buildQiitaFilterOptions(feedWithAuthorFilter);

      expect(result).toEqual({
        tagFilters: [],
        authorFilters: [
          {
            authorIds: ['user1', 'user2'],
            logicType: 'OR',
          },
        ],
        perPage: 100,
        page: 1,
      });
    });

    it('日付範囲フィルターが含まれる場合、正しいオプションを生成する', () => {
      const feedWithDateRangeFilter = {
        id: 'feed_123',
        name: 'テストフィード',
        filterGroups: [
          {
            id: 'group_1',
            filterId: 'feed_123',
            name: '日付範囲グループ',
            logicType: 'OR',
            tagFilters: [],
            authorFilters: [],
            dateRangeFilters: [
              {
                id: 'date_1',
                groupId: 'group_1',
                daysAgo: 30,
                createdAt: new Date(),
              },
            ],
          },
        ],
      } as unknown as PersonalizedFeedWithFilters;

      const result = mapper.buildQiitaFilterOptions(feedWithDateRangeFilter);

      expect(result).toEqual({
        tagFilters: [],
        authorFilters: [],
        dateRangeFilter: {
          daysAgo: 30,
        },
        perPage: 100,
        page: 1,
      });
    });

    it('複数のフィルターグループが含まれる場合、すべてのフィルターを正しく反映する', () => {
      const feedWithMultipleFilterGroups = {
        id: 'feed_123',
        name: 'テストフィード',
        filterGroups: [
          {
            id: 'group_1',
            filterId: 'feed_123',
            name: 'タググループ',
            logicType: 'AND',
            tagFilters: [
              {
                id: 'tag_1',
                groupId: 'group_1',
                tagName: 'JavaScript',
                createdAt: new Date(),
              },
              {
                id: 'tag_2',
                groupId: 'group_1',
                tagName: 'TypeScript',
                createdAt: new Date(),
              },
            ],
            authorFilters: [],
            dateRangeFilters: [],
          },
          {
            id: 'group_2',
            filterId: 'feed_123',
            name: '著者グループ',
            logicType: 'OR',
            tagFilters: [],
            authorFilters: [
              {
                id: 'author_1',
                groupId: 'group_2',
                authorId: 'user1',
                createdAt: new Date(),
              },
              {
                id: 'author_2',
                groupId: 'group_2',
                authorId: 'user2',
                createdAt: new Date(),
              },
            ],
            dateRangeFilters: [],
          },
          {
            id: 'group_3',
            filterId: 'feed_123',
            name: '日付範囲グループ',
            logicType: 'OR',
            tagFilters: [],
            authorFilters: [],
            dateRangeFilters: [
              {
                id: 'date_1',
                groupId: 'group_3',
                daysAgo: 30,
                createdAt: new Date(),
              },
            ],
          },
        ],
      } as unknown as PersonalizedFeedWithFilters;

      const result = mapper.buildQiitaFilterOptions(
        feedWithMultipleFilterGroups,
      );

      expect(result).toEqual({
        tagFilters: [
          {
            tagNames: ['JavaScript', 'TypeScript'],
            logicType: 'AND',
          },
        ],
        authorFilters: [
          {
            authorIds: ['user1', 'user2'],
            logicType: 'OR',
          },
        ],
        dateRangeFilter: {
          daysAgo: 30,
        },
        perPage: 100,
        page: 1,
      });
    });
  });

  describe('buildTagQuery', () => {
    it('空のタグフィルターから空の文字列を生成する', () => {
      const result = mapper.buildTagQuery({ tagNames: [], logicType: 'OR' });
      expect(result).toBe('');
    });

    it('1つのタグを持つORフィルターから正しいクエリを生成する', () => {
      const result = mapper.buildTagQuery({
        tagNames: ['JavaScript'],
        logicType: 'OR',
      });
      expect(result).toBe('tag:JavaScript');
    });

    it('複数のタグを持つORフィルターから正しいクエリを生成する', () => {
      const result = mapper.buildTagQuery({
        tagNames: ['JavaScript', 'TypeScript', 'React'],
        logicType: 'OR',
      });
      expect(result).toBe('(tag:JavaScript OR tag:TypeScript OR tag:React)');
    });

    it('複数のタグを持つANDフィルターから正しいクエリを生成する', () => {
      const result = mapper.buildTagQuery({
        tagNames: ['JavaScript', 'TypeScript', 'React'],
        logicType: 'AND',
      });
      expect(result).toBe('tag:JavaScript tag:TypeScript tag:React');
    });
  });

  describe('buildAuthorQuery', () => {
    it('空の著者フィルターから空の文字列を生成する', () => {
      const result = mapper.buildAuthorQuery({
        authorIds: [],
        logicType: 'OR',
      });
      expect(result).toBe('');
    });

    it('1人の著者を持つORフィルターから正しいクエリを生成する', () => {
      const result = mapper.buildAuthorQuery({
        authorIds: ['user1'],
        logicType: 'OR',
      });
      expect(result).toBe('user:user1');
    });

    it('複数の著者を持つORフィルターから正しいクエリを生成する', () => {
      const result = mapper.buildAuthorQuery({
        authorIds: ['user1', 'user2', 'user3'],
        logicType: 'OR',
      });
      expect(result).toBe('(user:user1 OR user:user2 OR user:user3)');
    });

    it('複数の著者を持つANDフィルターでも論理和(OR)のクエリを生成する', () => {
      const result = mapper.buildAuthorQuery({
        authorIds: ['user1', 'user2', 'user3'],
        logicType: 'AND', // AND指定でも著者は常にORで結合される
      });
      expect(result).toBe('(user:user1 OR user:user2 OR user:user3)');
    });
  });

  describe('buildDateRangeQuery', () => {
    beforeEach(() => {
      // 日付を2025-05-03に固定するためのモック
      const mockDayjs = jest.fn((date?: any) => {
        if (date) {
          return originalDayjs(date);
        }
        return originalDayjs('2025-05-03');
      }) as any;

      // dayjsのメソッドチェーンのために必要なメソッドを追加
      mockDayjs.subtract = jest.fn((days, unit) => {
        return originalDayjs('2025-05-03').subtract(days, unit);
      });
      mockDayjs.format = jest.fn((format) => {
        return originalDayjs('2025-05-03').format(format);
      });

      // グローバルのdayjsをモック化
      (global as any).dayjs = mockDayjs;
    });

    it('daysAgoを指定した場合に正しいクエリを生成する', () => {
      const result = mapper.buildDateRangeQuery({ daysAgo: 30 });
      expect(result).toBe('created:>=2025-04-03');
    });

    it('from日付を指定した場合に正しいクエリを生成する', () => {
      const result = mapper.buildDateRangeQuery({
        from: new Date('2025-04-01'),
      });
      expect(result).toBe('created:>=2025-04-01');
    });

    it('to日付を指定した場合に正しいクエリを生成する', () => {
      const result = mapper.buildDateRangeQuery({
        to: new Date('2025-04-30'),
      });
      expect(result).toBe('created:<=2025-04-30');
    });

    it('fromとto日付の両方を指定した場合に正しいクエリを生成する', () => {
      const result = mapper.buildDateRangeQuery({
        from: new Date('2025-04-01'),
        to: new Date('2025-04-30'),
      });
      expect(result).toBe('created:>=2025-04-01 created:<=2025-04-30');
    });

    it('daysAgoとfrom/toの両方が指定された場合はdaysAgoを優先する', () => {
      const result = mapper.buildDateRangeQuery({
        daysAgo: 7,
        from: new Date('2025-04-01'),
        to: new Date('2025-04-30'),
      });

      expect(result).toBe('created:>=2025-04-26');
      expect(result).not.toContain('2025-04-01');
      expect(result).not.toContain('2025-04-30');
    });
  });
});
