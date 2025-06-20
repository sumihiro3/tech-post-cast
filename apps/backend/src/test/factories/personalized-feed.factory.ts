import { PersonalizedFeedProgram } from '@prisma/client';
import { PersonalizedFeedWithFilters } from '@tech-post-cast/database';
import { QiitaPostFactory } from './qiita-post.factory';

/**
 * パーソナライズドフィードのモックデータを作成するファクトリークラス
 */
export class PersonalizedFeedFactory {
  /**
   * パーソナライズドフィードのモックデータを作成する
   * @param overrides 上書きするプロパティ
   * @returns PersonalizedFeedWithFilters
   */
  static createPersonalizedFeed(
    overrides: Partial<PersonalizedFeedWithFilters> = {},
  ): PersonalizedFeedWithFilters {
    return {
      id: 'feed-1',
      userId: 'user-1',
      name: 'テストフィード',
      dataSource: 'Qiita',
      filterConfig: {},
      deliveryConfig: {},
      deliveryFrequency: 'WEEKLY',
      isActive: true,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      filterGroups: [],
      ...overrides,
    } as PersonalizedFeedWithFilters;
  }

  /**
   * 複数のパーソナライズドフィードのモックデータを作成する
   * @param count 作成するフィード数
   * @param overrides 上書きするプロパティ
   * @returns PersonalizedFeedWithFilters[]
   */
  static createPersonalizedFeeds(
    count: number,
    overrides: Partial<PersonalizedFeedWithFilters> = {},
  ): PersonalizedFeedWithFilters[] {
    return Array.from({ length: count }, (_, index) =>
      this.createPersonalizedFeed({
        id: `feed-${index + 1}`,
        name: `テストフィード ${index + 1}`,
        ...overrides,
      }),
    );
  }

  /**
   * パーソナライズドフィードプログラムのモックデータを作成する
   * @param overrides 上書きするプロパティ
   * @returns PersonalizedFeedProgram
   */
  static createPersonalizedFeedProgram(
    overrides: Partial<PersonalizedFeedProgram> = {},
  ): PersonalizedFeedProgram {
    return {
      id: 'program-1',
      userId: 'user-1',
      feedId: 'feed-1',
      title: 'テストプログラム',
      script: JSON.stringify({
        title: 'テストプログラム',
        opening: 'これはテストプログラムです',
        posts: [
          {
            id: 'post-1',
            title: 'テスト記事1',
            intro: 'テスト記事1の紹介',
            explanation: 'テスト記事1の説明',
            summary: 'テスト記事1のまとめ',
          },
        ],
        ending: 'これでテストプログラムを終わります',
      }),
      audioUrl: 'https://example.com/audio.mp3',
      imageUrl: 'https://example.com/image.jpg',
      audioDuration: 300,
      chapters: JSON.stringify([
        {
          title: 'オープニング',
          startTime: 0,
          endTime: 10,
        },
        {
          title: 'テスト記事1',
          startTime: 10,
          endTime: 290,
        },
        {
          title: 'エンディング',
          startTime: 290,
          endTime: 300,
        },
      ]),
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      expiresAt: new Date('2023-02-01'),
      isExpired: false,
      ...overrides,
    };
  }

  /**
   * パーソナライズドプログラム音声生成結果のモックデータを作成する
   * @returns PersonalizedProgramAudioGenerateResult
   */
  static createProgramGenerateResult() {
    return {
      audioFileName: 'test.mp3',
      audioFilePath: '/tmp/test.mp3',
      audioDuration: 300,
      script: {
        title: 'テストプログラム',
        opening: 'これはテストプログラムです',
        posts: [
          {
            id: 'post-1',
            title: 'テスト記事1',
            intro: 'テスト記事1の紹介',
            explanation: 'テスト記事1の説明',
            summary: 'テスト記事1のまとめ',
          },
        ],
        ending: 'これでテストプログラムを終わります',
      },
      chapters: [
        {
          title: 'オープニング',
          startTime: 0,
          endTime: 10,
        },
        {
          title: 'テスト記事1',
          startTime: 10,
          endTime: 290,
        },
        {
          title: 'エンディング',
          startTime: 290,
          endTime: 300,
        },
      ],
    };
  }

  /**
   * プログラムアップロード結果のモックデータを作成する
   * @returns ProgramUploadResult
   */
  static createProgramUploadResult() {
    return {
      audioUrl: 'https://example.com/audio.mp3',
    };
  }
}
