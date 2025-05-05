import type {
  AuthorFilterDto,
  CreatePersonalizedFeedRequestDto,
  FilterGroupDto,
  GetPersonalizedFeedWithFiltersResponseDto,
  PersonalizedFeedDtoDeliveryFrequencyEnum,
  QiitaPostDto,
  TagFilterDto,
  UpdatePersonalizedFeedRequestDto,
} from '@/api';

/**
 * 入力されたパーソナライズフィードのデータ
 */
export interface InputPersonalizedFeedData {
  programTitle: string;
  filters: {
    authors: string[];
    tags: string[];
    dateRange: number; // 文字列から数値に変更（日数指定）
    likesCount: number; // いいね数
  };
  posts: QiitaPostDto[];
  totalCount: number;
  deliveryFrequency?: PersonalizedFeedDtoDeliveryFrequencyEnum; // 配信間隔
}

/**
 * APIのレスポンス(`GetPersonalizedFeedWithFiltersResponseDto`)から
 * 入力フォーム用のデータ(`InputPersonalizedFeedData`)に変換する
 *
 * @param response API からのレスポンスデータ
 * @returns 入力フォーム用のデータ
 */
export function convertApiResponseToInputData(
  response: GetPersonalizedFeedWithFiltersResponseDto,
): InputPersonalizedFeedData {
  console.debug(`convertApiResponseToInputData called`, { response });
  // レスポンスからフィードデータを取得
  const feedData = response.feed;

  // フィルターグループから著者とタグを抽出
  const authors: string[] = [];
  const tags: string[] = [];
  let dateRange: number = 7;
  let likesCount: number = 0;

  // フィルターグループがある場合は処理する
  if (feedData.filterGroups && feedData.filterGroups.length > 0) {
    const filterGroup = feedData.filterGroups[0]; // 通常は最初のグループを使用

    // 著者フィルターを抽出
    if (filterGroup.authorFilters) {
      filterGroup.authorFilters.forEach((filter) => {
        if (filter.authorId) {
          authors.push(filter.authorId);
        }
      });
    }

    // タグフィルターを抽出
    if (filterGroup.tagFilters) {
      filterGroup.tagFilters.forEach((filter) => {
        if (filter.tagName) {
          tags.push(filter.tagName);
        }
      });
    }

    // 日付範囲フィルターを抽出
    if (filterGroup.dateRangeFilters && filterGroup.dateRangeFilters.length > 0) {
      const filter = filterGroup.dateRangeFilters[0];
      if (filter && filter.daysAgo) {
        dateRange = filter.daysAgo;
      }
    }

    // いいね数フィルターを抽出
    if (filterGroup.likesCountFilters) {
      const filter = filterGroup.likesCountFilters[0];
      if (filter && filter.minLikes) {
        likesCount = filter.minLikes;
      }
    }
  }

  // 入力フォーム用のデータ構造に変換して返す
  return {
    programTitle: feedData.name,
    filters: {
      authors,
      tags,
      dateRange,
      likesCount,
    },
    posts: [], // APIレスポンスには記事データは含まれていないので空配列
    totalCount: 0, // APIレスポンスには記事の総数は含まれていないのでゼロ
    deliveryFrequency: feedData.deliveryFrequency, // 配信間隔
  };
}

/**
 * 入力フォーム用のデータ(`InputPersonalizedFeedData`)から
 * APIリクエスト用のデータ(`CreatePersonalizedFeedRequestDto`)に変換する
 *
 * @param inputData 入力フォーム用のデータ
 * @returns パーソナライズフィード作成リクエスト用のデータ
 */
export function convertInputDataToCreateDto(
  inputData: InputPersonalizedFeedData,
): CreatePersonalizedFeedRequestDto {
  // フィルターグループを作成
  const filterGroup: FilterGroupDto = {
    name: `${inputData.programTitle} のフィルターグループ1`,
    logicType: 'OR',
    tagFilters: [],
    authorFilters: [],
    dateRangeFilters: [],
    likesCountFilters: [],
  };

  // タグフィルターを追加
  if (inputData.filters.tags.length > 0) {
    filterGroup.tagFilters = inputData.filters.tags.map(
      (tag): TagFilterDto => ({
        tagName: tag,
      }),
    );
  }

  // 著者フィルターを追加
  if (inputData.filters.authors.length > 0) {
    filterGroup.authorFilters = inputData.filters.authors.map(
      (author): AuthorFilterDto => ({
        authorId: author,
      }),
    );
  }

  // 日付範囲フィルターを追加（-1=すべて以外の場合のみ）
  if (inputData.filters.dateRange > 0) {
    filterGroup.dateRangeFilters = [
      {
        daysAgo: inputData.filters.dateRange,
      },
    ];
  }

  // いいね数フィルターを追加
  let minLikes = 0;
  if (inputData.filters.likesCount > 0) {
    minLikes = inputData.filters.likesCount;
  }
  filterGroup.likesCountFilters = [
    {
      minLikes: minLikes,
    },
  ];

  // フィルター設定を作成
  const filterConfig = {
    dateRange: inputData.filters.dateRange,
  };

  // 配信設定のデフォルト値
  const deliveryConfig = {
    frequency: 'daily',
    time: '10:00',
  };

  // APIリクエスト用のデータを作成
  return {
    name: inputData.programTitle,
    dataSource: 'qiita',
    filterConfig,
    deliveryConfig,
    deliveryFrequency: inputData.deliveryFrequency || 'DAILY', // 配信間隔
    filterGroups: [filterGroup],
    isActive: true,
  };
}

/**
 * 入力フォーム用のデータ(`InputPersonalizedFeedData`)から
 * APIリクエスト用のデータ(`UpdatePersonalizedFeedRequestDto`)に変換する
 *
 * @param inputData 入力フォーム用のデータ
 * @returns パーソナライズフィード更新リクエスト用のデータ
 */
export function convertInputDataToUpdateDto(
  inputData: InputPersonalizedFeedData,
): UpdatePersonalizedFeedRequestDto {
  console.debug(`convertInputDataToUpdateDto called`, { inputData });
  // フィルターグループを作成
  const filterGroup: FilterGroupDto = {
    name: `${inputData.programTitle} のフィルターグループ1`,
    logicType: 'OR',
    tagFilters: [],
    authorFilters: [],
    dateRangeFilters: [],
    likesCountFilters: [],
  };

  // タグフィルターを追加
  if (inputData.filters.tags.length > 0) {
    filterGroup.tagFilters = inputData.filters.tags.map(
      (tag): TagFilterDto => ({
        tagName: tag,
      }),
    );
  }

  // 著者フィルターを追加
  if (inputData.filters.authors.length > 0) {
    filterGroup.authorFilters = inputData.filters.authors.map(
      (author): AuthorFilterDto => ({
        authorId: author,
      }),
    );
  }

  // 日付範囲フィルターを追加
  if (inputData.filters.dateRange > 0) {
    filterGroup.dateRangeFilters = [
      {
        daysAgo: inputData.filters.dateRange,
      },
    ];
  }

  // いいね数フィルターを追加
  if (inputData.filters.likesCount > 0) {
    filterGroup.likesCountFilters = [
      {
        minLikes: inputData.filters.likesCount,
      },
    ];
  } else {
    filterGroup.likesCountFilters = [
      {
        minLikes: 0,
      },
    ];
  }

  // フィルター設定を作成
  const filterConfig = {
    dateRange: inputData.filters.dateRange,
  };

  // 更新用のデータを作成
  return {
    name: inputData.programTitle,
    filterConfig,
    deliveryFrequency: inputData.deliveryFrequency, // 配信間隔
    filterGroups: [filterGroup],
  };
}
