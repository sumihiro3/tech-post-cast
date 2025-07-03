import { PersonalizedFeedWithFilters } from '@/domains/personalized-feeds/personalized-feeds.entity';
import { SpeakerMode } from '@prisma/client';

/**
 * パーソナライズフィードのモックデータを作成するファクトリークラス
 */
export class PersonalizedFeedFactory {
  /**
   * 単一のパーソナライズフィードモックデータを作成する
   * @param overrides 上書きするプロパティ
   * @returns PersonalizedFeedWithFilters
   */
  static createPersonalizedFeedWithFilters(
    overrides: Partial<PersonalizedFeedWithFilters> = {},
  ): PersonalizedFeedWithFilters {
    const defaultFeed: PersonalizedFeedWithFilters = {
      id: 'feed-1',
      userId: 'user-1',
      name: 'テストフィード1',
      dataSource: 'qiita',
      filterConfig: {},
      deliveryConfig: {},
      deliveryFrequency: 'DAILY',
      speakerMode: SpeakerMode.SINGLE,
      isActive: true,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
      filterGroups: [
        {
          id: 'group-1',
          filterId: 'feed-1',
          name: 'グループ1',
          logicType: 'OR',
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01'),
          tagFilters: [
            {
              id: 'tag-1',
              groupId: 'group-1',
              tagName: 'javascript',
              createdAt: new Date('2025-01-01'),
            },
          ],
          authorFilters: [
            {
              id: 'author-1',
              groupId: 'group-1',
              authorId: 'author-1',
              createdAt: new Date('2025-01-01'),
            },
          ],
          dateRangeFilters: [
            {
              id: 'date-1',
              groupId: 'group-1',
              daysAgo: 7,
              createdAt: new Date('2025-01-01'),
            },
          ],
          likesCountFilters: [
            {
              id: 'likes-1',
              groupId: 'group-1',
              minLikes: 10,
              createdAt: new Date('2025-01-01'),
            },
          ],
        },
      ],
    };

    return {
      ...defaultFeed,
      ...overrides,
      filterGroups: overrides.filterGroups || defaultFeed.filterGroups,
    };
  }

  /**
   * 複数のパーソナライズフィードモックデータを作成する
   * @param count 作成するフィード数
   * @param overrides 上書きするプロパティ
   * @returns PersonalizedFeedWithFilters[]
   */
  static createPersonalizedFeedsWithFilters(
    count: number,
    overrides: Partial<PersonalizedFeedWithFilters> = {},
  ): PersonalizedFeedWithFilters[] {
    return Array.from({ length: count }, (_, index) =>
      this.createPersonalizedFeedWithFilters({
        id: `feed-${index + 1}`,
        name: `テストフィード${index + 1}`,
        createdAt: new Date(`2025-01-${String(index + 1).padStart(2, '0')}`),
        updatedAt: new Date(`2025-01-${String(index + 1).padStart(2, '0')}`),
        filterGroups: [
          {
            id: `group-${index + 1}`,
            filterId: `feed-${index + 1}`,
            name: `グループ${index + 1}`,
            logicType: 'OR',
            createdAt: new Date(
              `2025-01-${String(index + 1).padStart(2, '0')}`,
            ),
            updatedAt: new Date(
              `2025-01-${String(index + 1).padStart(2, '0')}`,
            ),
            tagFilters: [
              {
                id: `tag-${index + 1}`,
                groupId: `group-${index + 1}`,
                tagName: index % 2 === 0 ? 'javascript' : 'typescript',
                createdAt: new Date(
                  `2025-01-${String(index + 1).padStart(2, '0')}`,
                ),
              },
            ],
            authorFilters:
              index % 3 === 0
                ? [
                    {
                      id: `author-${index + 1}`,
                      groupId: `group-${index + 1}`,
                      authorId: `author-${index + 1}`,
                      createdAt: new Date(
                        `2025-01-${String(index + 1).padStart(2, '0')}`,
                      ),
                    },
                  ]
                : [],
            dateRangeFilters:
              index % 4 === 0
                ? [
                    {
                      id: `date-${index + 1}`,
                      groupId: `group-${index + 1}`,
                      daysAgo: 7,
                      createdAt: new Date(
                        `2025-01-${String(index + 1).padStart(2, '0')}`,
                      ),
                    },
                  ]
                : [],
            likesCountFilters:
              index % 5 === 0
                ? [
                    {
                      id: `likes-${index + 1}`,
                      groupId: `group-${index + 1}`,
                      minLikes: 10,
                      createdAt: new Date(
                        `2025-01-${String(index + 1).padStart(2, '0')}`,
                      ),
                    },
                  ]
                : [],
          },
        ],
        ...overrides,
      }),
    );
  }

  /**
   * フィルターなしのパーソナライズフィードモックデータを作成する
   * @param overrides 上書きするプロパティ
   * @returns PersonalizedFeedWithFilters
   */
  static createPersonalizedFeedWithoutFilters(
    overrides: Partial<PersonalizedFeedWithFilters> = {},
  ): PersonalizedFeedWithFilters {
    return this.createPersonalizedFeedWithFilters({
      filterGroups: [],
      ...overrides,
    });
  }

  /**
   * 非アクティブなパーソナライズフィードモックデータを作成する
   * @param overrides 上書きするプロパティ
   * @returns PersonalizedFeedWithFilters
   */
  static createInactivePersonalizedFeed(
    overrides: Partial<PersonalizedFeedWithFilters> = {},
  ): PersonalizedFeedWithFilters {
    return this.createPersonalizedFeedWithFilters({
      isActive: false,
      ...overrides,
    });
  }
}
