import type { GetPersonalizedFeedWithFiltersResponseDto } from '@/api';
import {
  convertApiResponseToInputData,
  convertInputDataToCreateDto,
  convertInputDataToUpdateDto,
  type InputPersonalizedFeedData,
} from '.';

describe('パーソナライズフィード変換関数のテスト', () => {
  describe('convertApiResponseToInputData', () => {
    it('APIレスポンスから入力フォーム用のデータに正しく変換できること', () => {
      // モックデータを作成
      const mockResponse: GetPersonalizedFeedWithFiltersResponseDto = {
        feed: {
          id: 'feed_123',
          name: 'テスト番組',
          dataSource: 'qiita',
          filterConfig: { dateRange: 'すべて' },
          deliveryConfig: { frequency: 'daily', time: '10:00' },
          isActive: true,
          createdAt: '2025-04-15T10:00:00.000Z',
          updatedAt: '2025-04-15T10:00:00.000Z',
          filterGroups: [
            {
              id: 'group_123',
              filterId: 'feed_123',
              name: 'フィルターグループ1',
              logicType: 'OR',
              tagFilters: [
                {
                  id: 'tag_1',
                  groupId: 'group_123',
                  tagName: 'JavaScript',
                  createdAt: '2025-04-15T10:00:00.000Z',
                },
                {
                  id: 'tag_2',
                  groupId: 'group_123',
                  tagName: 'TypeScript',
                  createdAt: '2025-04-15T10:00:00.000Z',
                },
              ],
              authorFilters: [
                {
                  id: 'author_1',
                  groupId: 'group_123',
                  authorId: 'sumihiro3',
                  createdAt: '2025-04-15T10:00:00.000Z',
                },
              ],
              dateRangeFilters: [
                {
                  id: 'date_1',
                  groupId: 'group_123',
                  daysAgo: 30,
                  createdAt: '2025-04-15T10:00:00.000Z',
                },
              ],
              createdAt: '2025-04-15T10:00:00.000Z',
              updatedAt: '2025-04-15T10:00:00.000Z',
            },
          ],
        },
      };

      // 変換関数を実行
      const result = convertApiResponseToInputData(mockResponse);

      // 変換結果を検証
      expect(result.programTitle).toBe('テスト番組');
      expect(result.filters.authors).toEqual(['sumihiro3']);
      expect(result.filters.tags).toEqual(['JavaScript', 'TypeScript']);
      expect(result.filters.dateRange).toBe(30);
      expect(result.posts).toEqual([]);
      expect(result.totalCount).toBe(0);
    });

    it('フィルターグループが空の場合、空の配列とデフォルト値が設定されること', () => {
      // モックデータを作成（フィルターグループなし）
      const mockResponse: GetPersonalizedFeedWithFiltersResponseDto = {
        feed: {
          id: 'feed_123',
          name: 'テスト番組',
          dataSource: 'qiita',
          filterConfig: { dateRange: 'すべて' },
          deliveryConfig: { frequency: 'daily', time: '10:00' },
          isActive: true,
          createdAt: '2025-04-15T10:00:00.000Z',
          updatedAt: '2025-04-15T10:00:00.000Z',
          filterGroups: [],
        },
      };

      // 変換関数を実行
      const result = convertApiResponseToInputData(mockResponse);

      // 変換結果を検証
      expect(result.programTitle).toBe('テスト番組');
      expect(result.filters.authors).toEqual([]);
      expect(result.filters.tags).toEqual([]);
      expect(result.filters.dateRange).toBe(-1); // デフォルト値: -1（すべて）
      expect(result.posts).toEqual([]);
      expect(result.totalCount).toBe(0);
    });

    it('日付範囲フィルターがない場合、デフォルト値が設定されること', () => {
      // モックデータを作成（日付範囲フィルターなし）
      const title = 'テスト番組';
      const mockResponse: GetPersonalizedFeedWithFiltersResponseDto = {
        feed: {
          id: 'feed_123',
          name: title,
          dataSource: 'qiita',
          filterConfig: { dateRange: 'すべて' },
          deliveryConfig: { frequency: 'daily', time: '10:00' },
          isActive: true,
          createdAt: '2025-04-15T10:00:00.000Z',
          updatedAt: '2025-04-15T10:00:00.000Z',
          filterGroups: [
            {
              id: 'group_123',
              filterId: 'feed_123',
              name: `${title} のフィルターグループ1`,
              logicType: 'OR',
              tagFilters: [
                {
                  id: 'tag_1',
                  groupId: 'group_123',
                  tagName: 'JavaScript',
                  createdAt: '2025-04-15T10:00:00.000Z',
                },
              ],
              authorFilters: [
                {
                  id: 'author_1',
                  groupId: 'group_123',
                  authorId: 'sumihiro3',
                  createdAt: '2025-04-15T10:00:00.000Z',
                },
              ],
              dateRangeFilters: [], // 空の配列
              createdAt: '2025-04-15T10:00:00.000Z',
              updatedAt: '2025-04-15T10:00:00.000Z',
            },
          ],
        },
      };

      // 変換関数を実行
      const result = convertApiResponseToInputData(mockResponse);

      // 変換結果を検証
      expect(result.filters.dateRange).toBe(-1); // デフォルト値: -1（すべて）
    });
  });

  describe('convertInputDataToCreateDto', () => {
    it('入力フォームデータから作成リクエストDTOに正しく変換できること', () => {
      // 入力フォームデータのモック
      const title = 'テスト番組';
      const inputData: InputPersonalizedFeedData = {
        programTitle: title,
        filters: {
          authors: ['sumihiro3', 'tecpostcast'],
          tags: ['JavaScript', 'TypeScript', 'Vue.js'],
          dateRange: 30,
        },
        posts: [],
        totalCount: 0,
      };

      // 変換関数を実行
      const result = convertInputDataToCreateDto(inputData);

      // 変換結果を検証
      expect(result.name).toBe(title);
      expect(result.dataSource).toBe('qiita');
      expect(result.isActive).toBe(true);

      // filterConfigを検証
      expect(result.filterConfig).toEqual({ dateRange: 30 });

      // deliveryConfigを検証
      expect(result.deliveryConfig).toEqual({ frequency: 'daily', time: '10:00' });

      // filterGroupsを検証
      expect(result.filterGroups?.length).toBe(1);
      const filterGroup = result.filterGroups?.[0];
      expect(filterGroup?.name).toBe(`${title} のフィルターグループ1`);
      expect(filterGroup?.logicType).toBe('OR');

      // tagFiltersを検証
      expect(filterGroup?.tagFilters?.length).toBe(3);
      expect(filterGroup?.tagFilters?.[0].tagName).toBe('JavaScript');
      expect(filterGroup?.tagFilters?.[1].tagName).toBe('TypeScript');
      expect(filterGroup?.tagFilters?.[2].tagName).toBe('Vue.js');

      // authorFiltersを検証
      expect(filterGroup?.authorFilters?.length).toBe(2);
      expect(filterGroup?.authorFilters?.[0].authorId).toBe('sumihiro3');
      expect(filterGroup?.authorFilters?.[1].authorId).toBe('tecpostcast');

      // dateRangeFiltersを検証
      expect(filterGroup?.dateRangeFilters?.length).toBe(1);
      expect(filterGroup?.dateRangeFilters?.[0].daysAgo).toBe(30);
    });

    it('空のフィルターで変換できること', () => {
      // 入力フォームデータのモック（空のフィルター）
      const inputData: InputPersonalizedFeedData = {
        programTitle: 'テスト番組',
        filters: {
          authors: [],
          tags: [],
          dateRange: -1, // すべて
        },
        posts: [],
        totalCount: 0,
      };

      // 変換関数を実行
      const result = convertInputDataToCreateDto(inputData);

      // 変換結果を検証
      expect(result.name).toBe('テスト番組');

      // filterGroupsを検証
      const filterGroup = result.filterGroups?.[0];
      expect(filterGroup?.tagFilters).toEqual([]);
      expect(filterGroup?.authorFilters).toEqual([]);
      expect(filterGroup?.dateRangeFilters).toEqual([]);
    });

    it('dateRangeが-1（すべて）の場合、dateRangeFiltersが設定されないこと', () => {
      // 入力フォームデータのモック（dateRangeが-1）
      const inputData: InputPersonalizedFeedData = {
        programTitle: 'テスト番組',
        filters: {
          authors: ['sumihiro3'],
          tags: ['JavaScript'],
          dateRange: -1, // すべて
        },
        posts: [],
        totalCount: 0,
      };

      // 変換関数を実行
      const result = convertInputDataToCreateDto(inputData);

      // 変換結果を検証
      const filterGroup = result.filterGroups?.[0];
      expect(filterGroup?.dateRangeFilters).toEqual([]);
    });
  });

  describe('convertInputDataToUpdateDto', () => {
    it('入力フォームデータから更新リクエストDTOに正しく変換できること', () => {
      // 入力フォームデータのモック
      const inputData: InputPersonalizedFeedData = {
        programTitle: 'テスト番組（更新後）',
        filters: {
          authors: ['sumihiro3'],
          tags: ['JavaScript', 'TypeScript'],
          dateRange: 90,
        },
        posts: [],
        totalCount: 0,
      };

      // 変換関数を実行
      const result = convertInputDataToUpdateDto(inputData);

      // 変換結果を検証
      expect(result.name).toBe('テスト番組（更新後）');

      // filterConfigを検証
      expect(result.filterConfig).toEqual({ dateRange: 90 });

      // filterGroupsを検証
      expect(result.filterGroups?.length).toBe(1);
      const filterGroup = result.filterGroups?.[0];
      expect(filterGroup?.name).toBe('フィルターグループ1');
      expect(filterGroup?.logicType).toBe('OR');

      // tagFiltersを検証
      expect(filterGroup?.tagFilters?.length).toBe(2);
      expect(filterGroup?.tagFilters?.[0].tagName).toBe('JavaScript');
      expect(filterGroup?.tagFilters?.[1].tagName).toBe('TypeScript');

      // authorFiltersを検証
      expect(filterGroup?.authorFilters?.length).toBe(1);
      expect(filterGroup?.authorFilters?.[0].authorId).toBe('sumihiro3');

      // dateRangeFiltersを検証
      expect(filterGroup?.dateRangeFilters?.length).toBe(1);
      expect(filterGroup?.dateRangeFilters?.[0].daysAgo).toBe(90);
    });

    it('dateRangeが-1（すべて）の場合、dateRangeFiltersが設定されないこと', () => {
      // 入力フォームデータのモック（dateRangeが-1）
      const inputData: InputPersonalizedFeedData = {
        programTitle: 'テスト番組',
        filters: {
          authors: ['sumihiro3'],
          tags: ['JavaScript'],
          dateRange: -1, // すべて
        },
        posts: [],
        totalCount: 0,
      };

      // 変換関数を実行
      const result = convertInputDataToUpdateDto(inputData);

      // 変換結果を検証
      const filterGroup = result.filterGroups?.[0];
      expect(filterGroup?.dateRangeFilters).toEqual([]);
    });

    it('更新リクエストDTOでは不要なプロパティが含まれないこと', () => {
      // 入力フォームデータのモック
      const inputData: InputPersonalizedFeedData = {
        programTitle: 'テスト番組',
        filters: {
          authors: [],
          tags: [],
          dateRange: 30,
        },
        posts: [],
        totalCount: 0,
      };

      // 変換関数を実行
      const result = convertInputDataToUpdateDto(inputData);

      // 変換結果を検証 - 作成リクエストには存在するがここにはないプロパティ
      expect(result.dataSource).toBeUndefined();
      expect(result.deliveryConfig).toBeUndefined();
      expect(result.isActive).toBeUndefined();
    });
  });
});
