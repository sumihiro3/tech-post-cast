import { ApiProperty } from '@nestjs/swagger';
import { Min } from 'class-validator';

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
  limit: number;

  @ApiProperty({
    description: 'ページ番号',
    example: 0,
    default: 1,
    required: false,
  })
  @Min(1)
  page?: number;
}
