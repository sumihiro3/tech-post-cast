import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

/**
 * 個別パーソナライズフィード取得リクエストDTO
 */
export class GetPersonalizedFeedRequestDto {
  @ApiProperty({
    description: 'フィルター情報を含めるかどうか',
    default: false,
    required: false,
    example: false,
    type: Boolean,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({
    message: 'フィルター情報を含めるかどうかは真偽値である必要があります',
  })
  includeFilters?: boolean = false;
}
