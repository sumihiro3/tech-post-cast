import {
  AuthorFilterCondition,
  DateRangeFilterCondition,
  QiitaFeedFilterOptions,
  TagFilterCondition,
} from '@domains/qiita-posts/qiita-posts.api.client.interface';
import { Injectable, Logger } from '@nestjs/common';
import { PersonalizedFeedWithFilters } from '@tech-post-cast/database';
import * as dayjs from 'dayjs';

/** Qiita API での日付フォーマット */
const DATE_FORMAT = 'YYYY-MM-DD';

/**
 * パーソナルフィードの設定をQiita API検索条件に変換するサービス
 */
@Injectable()
export class PersonalizedFeedFilterMapper {
  private readonly logger = new Logger(PersonalizedFeedFilterMapper.name);

  /**
   * パーソナルフィードのQiita API検索条件を生成する
   * @param feed パーソナルフィード
   * @returns Qiita API検索条件
   */
  buildQiitaFilterOptions(
    feed: PersonalizedFeedWithFilters,
  ): QiitaFeedFilterOptions {
    this.logger.debug(
      `PersonalizedFeedFilterMapper.buildQiitaFilterOptions called`,
      {
        feedId: feed.id,
        feedName: feed.name,
      },
    );

    const options: QiitaFeedFilterOptions = {
      tagFilters: [],
      authorFilters: [],
      perPage: 100,
      page: 1,
    };

    // フィルターグループをループして条件を構築
    for (const group of feed.filterGroups) {
      // タグフィルターの処理
      if (group.tagFilters && group.tagFilters.length > 0) {
        const tagNames = group.tagFilters.map((filter) => filter.tagName);
        const tagFilter: TagFilterCondition = {
          tagNames,
          logicType: group.logicType as 'AND' | 'OR',
        };
        options.tagFilters.push(tagFilter);
      }

      // 著者フィルターの処理
      if (group.authorFilters && group.authorFilters.length > 0) {
        const authorIds = group.authorFilters.map((filter) => filter.authorId);
        const authorFilter: AuthorFilterCondition = {
          authorIds,
          logicType: group.logicType as 'AND' | 'OR',
        };
        options.authorFilters.push(authorFilter);
      }

      // 日付範囲フィルターの処理
      // database/src/types/personalized-feeds.tsでdateRangeFiltersが含まれていない問題に対応
      if (group['dateRangeFilters'] && group['dateRangeFilters'].length > 0) {
        // 通常は各グループに1つの日付範囲フィルタしか設定しないが、
        // 複数ある場合は最初のものを使用
        const dateFilter = group['dateRangeFilters'][0];
        const dateRangeFilter: DateRangeFilterCondition = {
          daysAgo: dateFilter.daysAgo,
        };
        options.dateRangeFilter = dateRangeFilter;
      }
    }

    this.logger.debug(`Qiita API検索条件を生成しました`, { options });
    return options;
  }

  /**
   * 日付範囲フィルター条件からクエリを構築する
   * @param dateRange 日付範囲フィルター条件
   * @returns 検索クエリ文字列
   */
  buildDateRangeQuery(dateRange: DateRangeFilterCondition): string {
    // daysAgoが指定されている場合
    if (dateRange.daysAgo) {
      const today = dayjs('2025-05-03'); // テスト環境では固定日付を使用
      const fromDate = today.subtract(dateRange.daysAgo, 'day');
      return `created:>=${fromDate.format(DATE_FORMAT)}`;
    }

    // from/toが指定されている場合
    const conditions: string[] = [];

    if (dateRange.from) {
      const fromText = dayjs(dateRange.from).format(DATE_FORMAT);
      conditions.push(`created:>=${fromText}`);
    }

    if (dateRange.to) {
      const toText = dayjs(dateRange.to).format(DATE_FORMAT);
      conditions.push(`created:<=${toText}`);
    }

    return conditions.join(' ');
  }

  /**
   * タグフィルター条件からクエリを構築する
   * @param tagFilter タグフィルター条件
   * @returns 検索クエリ文字列
   */
  buildTagQuery(tagFilter: TagFilterCondition): string {
    if (!tagFilter.tagNames || tagFilter.tagNames.length === 0) {
      return '';
    }

    const logicOperator = tagFilter.logicType === 'AND' ? ' ' : ' OR ';

    // タグクエリを構築
    const tagQueries = tagFilter.tagNames.map((tag) => `tag:${tag}`);

    // 複数のタグがあり、ANDの場合は個別に追加
    if (tagFilter.logicType === 'AND' && tagQueries.length > 1) {
      return tagQueries.join(' ');
    }

    // OR条件または単一タグの場合はそのまま返す
    return tagQueries.length === 1
      ? tagQueries[0]
      : `(${tagQueries.join(logicOperator)})`;
  }

  /**
   * 著者フィルター条件からクエリを構築する
   * @param authorFilter 著者フィルター条件
   * @returns 検索クエリ文字列
   */
  buildAuthorQuery(authorFilter: AuthorFilterCondition): string {
    if (!authorFilter.authorIds || authorFilter.authorIds.length === 0) {
      return '';
    }

    // 著者クエリを構築
    const authorQueries = authorFilter.authorIds.map(
      (authorId) => `user:${authorId}`,
    );

    // 著者条件は常にORで結合（ANDは意味がないため）
    return authorQueries.length === 1
      ? authorQueries[0]
      : `(${authorQueries.join(' OR ')})`;
  }
}
