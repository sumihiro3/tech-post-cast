import {
  HeadlineTopicProgramGenerateResult,
  ProgramUploadResult,
} from '@domains/radio-program/headline-topic-program';
import { HeadlineTopicProgram, QiitaPost } from '@prisma/client';

/**
 * ヘッドライントピック番組のモックデータを作成するファクトリークラス
 */
export class HeadlineTopicProgramFactory {
  /**
   * 単一のヘッドライントピック番組モックデータを作成する
   * @param overrides 上書きするプロパティ
   * @returns HeadlineTopicProgram
   */
  static createHeadlineTopicProgram(
    overrides: Partial<HeadlineTopicProgram> = {},
  ): HeadlineTopicProgram {
    const defaultScript = {
      title: 'テスト番組',
      intro: 'イントロ',
      posts: [{ summary: '記事1の要約' }, { summary: '記事2の要約' }],
      ending: 'エンディング',
    };

    const defaultChapters = [
      { title: 'イントロ', startTime: 0, endTime: 5000 },
      { title: '記事紹介', startTime: 5000, endTime: 10000 },
    ];

    return {
      id: 'test-program-id',
      title: 'テスト番組',
      audioDuration: 10000,
      audioUrl: 'https://example.com/audio.mp3',
      videoUrl: 'https://example.com/video.mp4',
      imageUrl: 'https://example.com/image.jpg',
      script: JSON.stringify(defaultScript),
      chapters: JSON.stringify(defaultChapters),
      createdAt: new Date('2023-01-15'),
      updatedAt: new Date('2023-01-15'),
      ...overrides,
    } as HeadlineTopicProgram;
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
        id: `test-program-id-${index + 1}`,
        title: `テスト番組 ${index + 1}`,
        ...overrides,
      }),
    );
  }

  /**
   * 番組生成結果のモックデータを作成する
   * @param overrides 上書きするプロパティ
   * @returns HeadlineTopicProgramGenerateResult
   */
  static createProgramGenerateResult(
    overrides: Partial<HeadlineTopicProgramGenerateResult> = {},
  ): HeadlineTopicProgramGenerateResult {
    return {
      script: {
        title: 'テスト番組',
        intro: 'イントロ',
        posts: [{ summary: '記事1の要約' }, { summary: '記事2の要約' }],
        ending: 'エンディング',
      },
      chapters: [
        { title: 'イントロ', startTime: 0, endTime: 5000 },
        { title: '記事紹介', startTime: 5000, endTime: 10000 },
      ],
      audioPath: '/path/to/audio.mp3',
      audioDuration: 10000,
      ...overrides,
    };
  }

  /**
   * 番組アップロード結果のモックデータを作成する
   * @param overrides 上書きするプロパティ
   * @returns ProgramUploadResult
   */
  static createProgramUploadResult(
    overrides: Partial<ProgramUploadResult> = {},
  ): ProgramUploadResult {
    return {
      audioUrl: 'https://example.com/audio.mp3',
      videoUrl: 'https://example.com/video.mp4',
      imageUrl: 'https://example.com/image.jpg',
      ...overrides,
    };
  }

  /**
   * Qiita記事のモックデータを作成する
   * @param overrides 上書きするプロパティ
   * @returns QiitaPost
   */
  static createQiitaPost(overrides: Partial<QiitaPost> = {}): QiitaPost {
    return {
      id: 'post-1',
      title: '記事1',
      url: 'https://qiita.com/test/items/post-1',
      authorId: 'author-1',
      authorName: 'テスト著者',
      likesCount: 10,
      stocksCount: 5,
      tags: ['tag1', 'tag2'],
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      refreshedAt: new Date('2023-01-01'),
      private: false,
      summary: '記事1の要約',
      headlineTopicProgramId: 'test-program-id',
      ...overrides,
    } as QiitaPost;
  }

  /**
   * 複数のQiita記事モックデータを作成する
   * @param count 作成する記事数
   * @param overrides 上書きするプロパティ
   * @returns QiitaPost[]
   */
  static createQiitaPosts(count: number, overrides: Partial<QiitaPost> = {}): QiitaPost[] {
    return Array.from({ length: count }, (_, index) =>
      this.createQiitaPost({
        id: `post-${index + 1}`,
        title: `記事${index + 1}`,
        likesCount: 10 - index,
        ...overrides,
      }),
    );
  }
}
