import { HeadlineTopicProgram } from '@prisma/client';
import { QiitaPostFactory } from './qiita-post.factory';

/**
 * ヘッドライントピック番組のモックデータを作成するファクトリークラス
 */
export class HeadlineTopicProgramFactory {
  /**
   * 単一のヘッドライントピック番組モックデータを作成する
   * @param overrides 上書きするプロパティ
   * @returns HeadlineTopicProgram
   */
  static createHeadlineTopicProgram(overrides: Partial<HeadlineTopicProgram> = {}): HeadlineTopicProgram {
    return {
      id: 'program-1',
      title: 'テスト番組タイトル',
      audioUrl: 'https://example.com/audio.mp3',
      imageUrl: 'https://example.com/image.jpg',
      audioDuration: 300,
      script: JSON.stringify({
        title: 'テスト番組タイトル',
        opening: 'これはテスト番組です',
        posts: [
          {
            id: 'post-1',
            title: 'テスト記事1',
            intro: 'テスト記事1の紹介',
            explanation: 'テスト記事1の説明',
            summary: 'テスト記事1のまとめ',
          },
        ],
        ending: 'これでテスト番組を終わります',
      }),
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
      videoUrl: '',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      ...overrides,
    };
  }

  /**
   * 複数のヘッドライントピック番組モックデータを作成する
   * @param count 作成する番組数
   * @param overrides 上書きするプロパティ
   * @returns HeadlineTopicProgram[]
   */
  static createHeadlineTopicPrograms(
    count: number,
    overrides: Partial<HeadlineTopicProgram> = {},
  ): HeadlineTopicProgram[] {
    return Array.from({ length: count }, (_, index) =>
      this.createHeadlineTopicProgram({
        id: `program-${index + 1}`,
        title: `テスト番組タイトル ${index + 1}`,
        ...overrides,
      }),
    );
  }

  /**
   * 番組生成結果のモックデータを作成する
   * @returns ProgramGenerateResult
   */
  static createProgramGenerateResult() {
    return {
      audioFileName: 'test.mp3',
      audioFilePath: '/tmp/test.mp3',
      audioDuration: 300,
      script: {
        title: 'テスト番組タイトル',
        opening: 'これはテスト番組です',
        posts: [
          {
            id: 'post-1',
            title: 'テスト記事1',
            intro: 'テスト記事1の紹介',
            explanation: 'テスト記事1の説明',
            summary: 'テスト記事1のまとめ',
          },
        ],
        ending: 'これでテスト番組を終わります',
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
   * 番組アップロード結果のモックデータを作成する
   * @returns ProgramUploadResult
   */
  static createProgramUploadResult() {
    return {
      audioUrl: 'https://example.com/audio.mp3',
      imageUrl: 'https://example.com/image.jpg',
    };
  }

  /**
   * Qiita記事のモックデータを作成する
   * @param count 作成する記事数
   * @returns QiitaPost[]
   */
  static createQiitaPosts(count: number = 3) {
    return QiitaPostFactory.createQiitaPostModels(count);
  }
}
