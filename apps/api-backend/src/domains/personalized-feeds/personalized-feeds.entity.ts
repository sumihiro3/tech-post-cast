import { PersonalizedFeed as PrismaPersonalizedFeed } from '@prisma/client';

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
    this.isActive = data.isActive;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
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
