import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * フィード別番組生成履歴取得リクエストDTO
 */
export class GetProgramAttemptsRequestDto {
  @ApiProperty({
    description: 'ページ番号（1から始まる）',
    default: 1,
    required: false,
    minimum: 1,
    example: 1,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'ページ番号は整数である必要があります' })
  @Min(1, { message: 'ページ番号は1以上である必要があります' })
  page?: number = 1;

  @ApiProperty({
    description: '1ページあたりの件数',
    default: 20,
    required: false,
    minimum: 1,
    maximum: 100,
    example: 20,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '1ページあたりの件数は整数である必要があります' })
  @Min(1, { message: '1ページあたりの件数は1以上である必要があります' })
  @Max(100, { message: '1ページあたりの件数は100以下である必要があります' })
  limit?: number = 20;
}
