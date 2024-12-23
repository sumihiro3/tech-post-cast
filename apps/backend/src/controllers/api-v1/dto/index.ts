import { ApiProperty } from '@nestjs/swagger';
import { HeadlineTopicProgramWithQiitaPosts } from '@tech-post-cast/database';
import { IsNumber, IsString, Min } from 'class-validator';

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
  @IsNumber()
  limit: number;

  @ApiProperty({
    description: 'ページ番号',
    example: 0,
    default: 1,
    required: false,
  })
  @Min(1)
  @IsNumber()
  page?: number;
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
    //
    return dto;
  }
}
