import { PersonalizedFeedProgramWithDetails } from '@tech-post-cast/database';

/**
 * パーソナライズプログラムのモックデータを作成するファクトリークラス
 */
export class PersonalizedProgramFactory {
  /**
   * 単一のパーソナライズプログラムモックデータを作成する
   * @param overrides 上書きするプロパティ
   * @returns PersonalizedFeedProgramWithDetails
   */
  static createPersonalizedProgram(
    overrides: Partial<PersonalizedFeedProgramWithDetails> = {},
  ): PersonalizedFeedProgramWithDetails {
    const defaultProgram: PersonalizedFeedProgramWithDetails = {
      id: 'program-1',
      userId: 'user-1',
      feedId: 'feed-1',
      title: 'テストプログラム1',
      script: { title: 'テストプログラム1' },
      audioUrl: 'https://example.com/audio1.mp3',
      audioDuration: 300,
      chapters: [],
      imageUrl: null,
      expiresAt: null,
      isExpired: false,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
      feed: {
        id: 'feed-1',
        name: 'テストフィード1',
        dataSource: 'qiita',
      },
      posts: [
        {
          id: 'post-1',
          title: 'テスト記事1',
          url: 'https://qiita.com/articles/post1',
          likesCount: 10,
          stocksCount: 5,
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01'),
          authorId: 'author-1',
          authorName: 'テスト著者1',
          private: false,
          refreshedAt: new Date('2025-01-01'),
          summary: 'テスト要約1',
        },
      ],
    };

    return {
      ...defaultProgram,
      ...overrides,
      feed: overrides.feed || defaultProgram.feed,
      posts: overrides.posts || defaultProgram.posts,
    };
  }

  /**
   * 複数のパーソナライズプログラムモックデータを作成する
   * @param count 作成するプログラム数
   * @param overrides 上書きするプロパティ
   * @returns PersonalizedFeedProgramWithDetails[]
   */
  static createPersonalizedPrograms(
    count: number,
    overrides: Partial<PersonalizedFeedProgramWithDetails> = {},
  ): PersonalizedFeedProgramWithDetails[] {
    return Array.from({ length: count }, (_, index) =>
      this.createPersonalizedProgram({
        id: `program-${index + 1}`,
        title: `テストプログラム${index + 1}`,
        script: { title: `テストプログラム${index + 1}` },
        audioUrl: `https://example.com/audio${index + 1}.mp3`,
        audioDuration: 300 + index * 60, // 各プログラムで異なる長さ
        createdAt: new Date(`2025-01-${String(index + 1).padStart(2, '0')}`),
        updatedAt: new Date(`2025-01-${String(index + 1).padStart(2, '0')}`),
        feed: {
          id: `feed-${index + 1}`,
          name: `テストフィード${index + 1}`,
          dataSource: 'qiita',
        },
        posts: [
          {
            id: `post-${index + 1}`,
            title: `テスト記事${index + 1}`,
            url: `https://qiita.com/articles/post${index + 1}`,
            likesCount: 10 - index,
            stocksCount: 5 - Math.floor(index / 2),
            createdAt: new Date(
              `2025-01-${String(index + 1).padStart(2, '0')}`,
            ),
            updatedAt: new Date(
              `2025-01-${String(index + 1).padStart(2, '0')}`,
            ),
            authorId: `author-${index + 1}`,
            authorName: `テスト著者${index + 1}`,
            private: false,
            refreshedAt: new Date(
              `2025-01-${String(index + 1).padStart(2, '0')}`,
            ),
            summary: `テスト要約${index + 1}`,
          },
        ],
        ...overrides,
      }),
    );
  }

  /**
   * 複数の記事を持つパーソナライズプログラムモックデータを作成する
   * @param postsCount 記事数
   * @param overrides 上書きするプロパティ
   * @returns PersonalizedFeedProgramWithDetails
   */
  static createPersonalizedProgramWithMultiplePosts(
    postsCount: number,
    overrides: Partial<PersonalizedFeedProgramWithDetails> = {},
  ): PersonalizedFeedProgramWithDetails {
    const posts = Array.from({ length: postsCount }, (_, index) => ({
      id: `post-${index + 1}`,
      title: `テスト記事${index + 1}`,
      url: `https://qiita.com/articles/post${index + 1}`,
      likesCount: 10 - index,
      stocksCount: 5 - Math.floor(index / 2),
      createdAt: new Date(`2025-01-${String(index + 1).padStart(2, '0')}`),
      updatedAt: new Date(`2025-01-${String(index + 1).padStart(2, '0')}`),
      authorId: `author-${index + 1}`,
      authorName: `テスト著者${index + 1}`,
      private: false,
      refreshedAt: new Date(`2025-01-${String(index + 1).padStart(2, '0')}`),
      summary: `テスト要約${index + 1}`,
    }));

    return this.createPersonalizedProgram({
      posts,
      ...overrides,
    });
  }

  /**
   * 期限切れのパーソナライズプログラムモックデータを作成する
   * @param overrides 上書きするプロパティ
   * @returns PersonalizedFeedProgramWithDetails
   */
  static createExpiredPersonalizedProgram(
    overrides: Partial<PersonalizedFeedProgramWithDetails> = {},
  ): PersonalizedFeedProgramWithDetails {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    return this.createPersonalizedProgram({
      expiresAt: yesterday,
      isExpired: true,
      ...overrides,
    });
  }

  /**
   * 画像付きのパーソナライズプログラムモックデータを作成する
   * @param overrides 上書きするプロパティ
   * @returns PersonalizedFeedProgramWithDetails
   */
  static createPersonalizedProgramWithImage(
    overrides: Partial<PersonalizedFeedProgramWithDetails> = {},
  ): PersonalizedFeedProgramWithDetails {
    return this.createPersonalizedProgram({
      imageUrl: 'https://example.com/image1.jpg',
      ...overrides,
    });
  }
}
