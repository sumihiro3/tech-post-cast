import {
  DeliveryFrequency,
  PersonalizedFeed as PrismaPersonalizedFeed,
} from '@prisma/client';
import { PersonalizedFeedWithFilters as PrismaPersonalizedFeedWithFilters } from '@tech-post-cast/database';

/**
 * パーソナライズフィードのエンティティ
 */
export class PersonalizedFeed {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly dataSource: string;
  readonly filterConfig: Record<string, any>;
  readonly deliveryConfig: Record<string, any>;
  readonly deliveryFrequency: DeliveryFrequency;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(data: PrismaPersonalizedFeed) {
    this.id = data.id;
    this.userId = data.userId;
    this.name = data.name;
    this.dataSource = data.dataSource;
    this.filterConfig = data.filterConfig as Record<string, any>;
    this.deliveryConfig = data.deliveryConfig as Record<string, any>;
    this.deliveryFrequency = data.deliveryFrequency;
    this.isActive = data.isActive;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}

/**
 * フィルターグループエンティティ
 */
export class FilterGroup {
  readonly id: string;
  readonly filterId: string;
  readonly name: string;
  readonly logicType: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly tagFilters?: TagFilter[];
  readonly authorFilters?: AuthorFilter[];
  readonly dateRangeFilters?: DateRangeFilter[];

  constructor(data: any) {
    this.id = data.id;
    this.filterId = data.filterId;
    this.name = data.name;
    this.logicType = data.logicType;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.tagFilters = data.tagFilters?.map((tag: any) => new TagFilter(tag));
    this.authorFilters = data.authorFilters?.map(
      (author: any) => new AuthorFilter(author),
    );
    this.dateRangeFilters = data.dateRangeFilters?.map(
      (dateRange: any) => new DateRangeFilter(dateRange),
    );
  }
}

/**
 * タグフィルターエンティティ
 */
export class TagFilter {
  readonly id: string;
  readonly groupId: string;
  readonly tagName: string;
  readonly createdAt: Date;

  constructor(data: any) {
    this.id = data.id;
    this.groupId = data.groupId;
    this.tagName = data.tagName;
    this.createdAt = data.createdAt;
  }
}

/**
 * 著者フィルターエンティティ
 */
export class AuthorFilter {
  readonly id: string;
  readonly groupId: string;
  readonly authorId: string;
  readonly createdAt: Date;

  constructor(data: any) {
    this.id = data.id;
    this.groupId = data.groupId;
    this.authorId = data.authorId;
    this.createdAt = data.createdAt;
  }
}

/**
 * 公開日フィルターエンティティ
 */
export class DateRangeFilter {
  readonly id: string;
  readonly groupId: string;
  readonly daysAgo: number;
  readonly createdAt: Date;

  constructor(data: any) {
    this.id = data.id;
    this.groupId = data.groupId;
    this.daysAgo = data.daysAgo;
    this.createdAt = data.createdAt;
  }
}

/**
 * フィルターグループとフィルターを含むパーソナライズフィードエンティティ
 */
export class PersonalizedFeedWithFilters extends PersonalizedFeed {
  readonly filterGroups: FilterGroup[];

  constructor(data: PrismaPersonalizedFeedWithFilters) {
    super(data);
    this.filterGroups =
      data.filterGroups?.map((group) => new FilterGroup(group)) || [];
  }
}

/**
 * パーソナライズフィード一覧取得結果
 */
export class PersonalizedFeedsResult {
  constructor(
    readonly feeds: PersonalizedFeed[],
    readonly total: number,
  ) {}
}

/**
 * フィルター情報を含むパーソナライズフィード一覧取得結果
 */
export class PersonalizedFeedsWithFiltersResult {
  constructor(
    readonly feeds: PersonalizedFeedWithFilters[],
    readonly total: number,
  ) {}
}
