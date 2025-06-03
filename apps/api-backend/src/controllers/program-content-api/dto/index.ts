import { HeadlineTopicProgramWithSimilarAndNeighbors } from '@domains/radio-program/headline-topic-program';
import { ApiProperty } from '@nestjs/swagger';
import {
  HeadlineTopicProgramWithQiitaPosts,
  parseHeadlineTopicProgramChapters,
  parseHeadlineTopicProgramScript,
} from '@tech-post-cast/database';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';

/**
 * ヘッドライントピック番組取得要求DTO
 */
export class HeadlineTopicProgramsFindRequestDto {
  @ApiProperty({
    description: 'ページあたりに取得する番組の数',
    example: 10,
    default: 10,
    required: true,
  })
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  limit: number;

  @ApiProperty({
    description: 'ページ番号',
    example: 0,
    default: 1,
    required: false,
  })
  @Transform(({ value }) => parseInt(value))
  @Min(1)
  @IsNumber()
  page?: number;
}

/**
 * 記事の要約を表すDTO
 */
export class PostSummaryDto {
  /**
   * 記事の要約
   */
  @ApiProperty({
    description: '記事の要約',
    example: '記事の要約',
    required: true,
  })
  @IsString()
  summary: string;
}

/**
 * ヘッドライントピック番組の台本を表すDTO
 */
export class HeadlineTopicProgramScriptDto {
  /**
   * タイトル
   */
  @ApiProperty({
    description: 'タイトル',
    example: 'タイトル',
    required: true,
  })
  @IsString()
  title: string;

  /**
   * イントロダクション
   */
  @ApiProperty({
    description: 'イントロダクション',
    example: 'イントロダクション',
    required: true,
  })
  @IsString()
  intro: string;

  /**
   * 紹介記事の要約
   */
  @ApiProperty({
    description: '紹介記事の要約',
    example: [{ summary: '記事の要約' }],
    required: true,
    type: [PostSummaryDto],
  })
  posts: PostSummaryDto[];

  /**
   * エンディング
   */
  @ApiProperty({
    description: 'エンディング',
    example: 'エンディング',
    required: true,
  })
  @IsString()
  ending: string;
}

/**
 * ヘッドライントピック番組のチャプターを表すDTO
 */
export class HeadlineTopicProgramChapterDto {
  /**
   * タイトル
   */
  @ApiProperty({
    description: 'タイトル',
    example: 'タイトル',
    required: true,
  })
  @IsString()
  title: string;

  /**
   * チャプターの開始位置（ミリ秒）
   */
  @ApiProperty({
    description: 'チャプターの開始位置（ミリ秒）',
    example: 1000,
    required: true,
  })
  @IsNumber()
  startTime: number;

  /**
   * チャプターの終了位置（ミリ秒）
   */
  @ApiProperty({
    description: 'チャプターの終了位置（ミリ秒）',
    example: 2000,
    required: true,
  })
  @IsNumber()
  endTime: number;
}

/**
 * ヘッドライントピック番組で紹介するQiita記事を表すDTO
 */
export class HeadlineTopicProgramPostDto {
  /**
   * Qiita 記事ID
   */
  @ApiProperty({
    description: 'Qiita 記事ID',
    example: 'sample-post-id',
    required: true,
  })
  @IsString()
  id: string;

  /**
   * タイトル
   */
  @ApiProperty({
    description: 'タイトル',
    example: 'タイトル',
    required: true,
  })
  @IsString()
  title: string;

  /**
   * URL
   */
  @ApiProperty({
    description: 'URL',
    example: 'https://example.com',
    required: true,
  })
  @IsString()
  @IsUrl()
  url: string;

  /**
   * 記事が作成された日時
   */
  @ApiProperty({
    description: '記事が作成された日時',
    example: '2021-01-01T00:00:00Z',
    required: true,
  })
  @IsDate()
  createdAt: Date;

  /**
   * 記事投稿者のユーザ名
   */
  @ApiProperty({
    description: '記事投稿者のユーザ名',
    example: 'user-name',
    required: true,
  })
  @IsString()
  authorName: string;

  /**
   * 記事投稿者のユーザID
   */
  @ApiProperty({
    description: '記事投稿者のユーザID',
    example: 'user-id',
    required: true,
  })
  @IsString()
  authorId: string;
}

/**
 * ヘッドライントピック番組のDTO
 */
export class HeadlineTopicProgramDto {
  @ApiProperty({
    description: '番組ID',
    example: 'sample-program-id',
    required: true,
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'タイトル',
    example: 'サンプル番組',
    required: true,
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: '台本',
    example: '番組の台本',
    required: true,
    type: () => HeadlineTopicProgramScriptDto,
  })
  @IsObject()
  script: HeadlineTopicProgramScriptDto;

  @ApiProperty({
    description: 'ヘッドライントピック番組のチャプター一覧',
    required: true,
    type: [HeadlineTopicProgramChapterDto],
  })
  @IsObject()
  chapters: HeadlineTopicProgramChapterDto[];

  @ApiProperty({
    description: 'ヘッドライントピックの音声ファイルURL',
    example: 'https://example.com/sample.mp3',
    required: true,
  })
  @IsString()
  @IsUrl()
  audioUrl: string;

  @ApiProperty({
    description: '音声ファイルの長さ（ミリ秒）',
    example: 1000,
    required: true,
  })
  @IsNumber()
  audioDuration: number;

  @ApiProperty({
    description: 'ヘッドライントピックの動画ファイルURL',
    example: 'https://example.com/sample.mp4',
    required: false,
  })
  @IsString()
  @IsUrl()
  videoUrl?: string;

  @ApiProperty({
    description: '画像URL',
    example: 'https://example.com/sample.jpg',
    required: false,
  })
  @IsString()
  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({
    description: '今日のヘッドライントピックが作成された日時',
    example: '2021-01-01T00:00:00Z',
    required: true,
  })
  @IsDate()
  createdAt: Date;

  @ApiProperty({
    description: '最終更新日時',
    example: '2021-01-01T00:00:00Z',
    required: true,
  })
  @IsDate()
  updatedAt: Date;

  @ApiProperty({
    description: '紹介している投稿の一覧',
    required: true,
    type: [HeadlineTopicProgramPostDto],
  })
  @IsObject()
  posts: HeadlineTopicProgramPostDto[];

  /**
   * HeadlineTopicProgramWithQiitaPosts から生成する
   * @param entity HeadlineTopicProgramWithQiitaPosts
   * @returns DTO
   */
  static createFromEntity(
    entity: HeadlineTopicProgramWithQiitaPosts,
  ): HeadlineTopicProgramDto {
    const dto = new HeadlineTopicProgramDto();
    dto.id = entity.id;
    dto.title = entity.title;
    dto.audioUrl = entity.audioUrl;
    dto.audioDuration = entity.audioDuration;
    dto.videoUrl = entity.videoUrl;
    dto.imageUrl = entity.imageUrl;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    // 台本
    // バリデーションと型変換
    const script = parseHeadlineTopicProgramScript(entity.script);
    const s = new HeadlineTopicProgramScriptDto();
    s.title = script.title;
    s.intro = script.intro;
    s.posts = script.posts.map((p) => {
      const post = new PostSummaryDto();
      post.summary = p.summary;
      return post;
    });
    s.ending = script.ending;
    dto.script = s;
    // チャプター
    // バリデーションと型変換
    const chapters = parseHeadlineTopicProgramChapters(entity.chapters);
    dto.chapters = chapters.map((c) => {
      const chapter = new HeadlineTopicProgramChapterDto();
      chapter.title = c.title;
      chapter.startTime = c.startTime;
      chapter.endTime = c.endTime;
      return chapter;
    });
    // Qiita 記事
    dto.posts = entity.posts.map((p) => {
      const post = new HeadlineTopicProgramPostDto();
      post.id = p.id;
      post.title = p.title;
      post.url = p.url;
      post.createdAt = p.createdAt;
      post.authorName = p.authorName;
      post.authorId = p.authorId;
      return post;
    });
    return dto;
  }
}

/**
 * ヘッドライントピック番組の番組数取得結果を表すDTO
 */
export class HeadlineTopicProgramsCountDto {
  @ApiProperty({
    description: '番組数',
    example: 100,
    required: true,
  })
  @IsNumber()
  count: number;
}

/**
 * 指定のヘッドライントピック番組と、その類似番組および、前日・翌日のヘッドライントピック番組を表すDTO
 */
export class HeadlineTopicProgramWithSimilarAndNeighborsDto {
  @ApiProperty({
    description: '類似のヘッドライントピック番組',
    required: true,
    type: [HeadlineTopicProgramDto],
  })
  @IsArray({ each: true })
  similar: HeadlineTopicProgramDto[];

  @ApiProperty({
    description: '前日のヘッドライントピック番組',
    required: false,
    type: HeadlineTopicProgramDto,
  })
  @IsObject()
  @IsOptional()
  previous?: HeadlineTopicProgramDto | null;

  @ApiProperty({
    description: '指定のヘッドライントピック番組',
    required: true,
    type: HeadlineTopicProgramDto,
  })
  @IsObject()
  target: HeadlineTopicProgramDto;

  @ApiProperty({
    description: '翌日のヘッドライントピック番組',
    required: false,
    type: HeadlineTopicProgramDto,
  })
  @IsObject()
  @IsOptional()
  next?: HeadlineTopicProgramDto | null;

  /**
   * HeadlineTopicProgramWithNeighbors から生成する
   * @param entity HeadlineTopicProgramWithNeighbors
   * @returns DTO
   */
  static createFromEntity(
    entity: HeadlineTopicProgramWithSimilarAndNeighbors,
  ): HeadlineTopicProgramWithSimilarAndNeighborsDto {
    const dto = new HeadlineTopicProgramWithSimilarAndNeighborsDto();
    dto.similar = entity.similar.map((p) =>
      HeadlineTopicProgramDto.createFromEntity(p),
    );
    dto.previous = entity.previous
      ? HeadlineTopicProgramDto.createFromEntity(entity.previous)
      : null;
    dto.target = HeadlineTopicProgramDto.createFromEntity(entity.target);
    dto.next = entity.next
      ? HeadlineTopicProgramDto.createFromEntity(entity.next)
      : null;
    return dto;
  }
}
