import { ApiProperty } from '@nestjs/swagger';
import { HeadlineTopicProgramWithQiitaPosts } from '@tech-post-cast/database';
import { Transform } from 'class-transformer';
import {
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
 * Qiita の記事を表すDTO
 */
export class QiitaPostDto {
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
    type: [QiitaPostDto],
  })
  @IsObject()
  posts: QiitaPostDto[];

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
    const scriptString = entity.script as HeadlineTopicProgramScriptType | null;
    if (!scriptString) {
      throw new Error('台本がありません');
    }
    const s = JSON.parse(
      scriptString.toString(),
    ) as HeadlineTopicProgramScriptType;
    const script = new HeadlineTopicProgramScriptDto();
    script.title = s.title;
    script.intro = s.intro;
    script.ending = s.ending;
    if (s.posts && s.posts.length > 0) {
      script.posts = s.posts.map((p) => {
        const post = new PostSummaryDto();
        post.summary = p.summary;
        return post;
      });
    }
    dto.script = script;
    // Qiita 記事
    dto.posts = entity.posts.map((p) => {
      const post = new QiitaPostDto();
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
 * ヘッドライントピック番組で紹介した Qiita の記事の要約を表す型
 */
type PostSummaryType = {
  summary: string;
};

/**
 * ヘッドライントピック番組の台本を表す型
 */
type HeadlineTopicProgramScriptType = {
  title: string;
  intro: string;
  posts: PostSummaryType[];
  ending: string;
};
