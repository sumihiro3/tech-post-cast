import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

/**
 * 用語と読み方のペアの生成要求DTO
 */
export class CreateTermRequestDto {
  @ApiProperty({
    description: '用語',
    example: 'agile',
    required: true,
  })
  @IsString()
  term: string;

  @ApiProperty({
    description: '読み方',
    example: 'あじゃいる',
    required: true,
  })
  @IsString()
  reading: string;
}

/**
 * 用語と読み方のペアのDTO
 */
export class TermDto {
  @ApiProperty({
    description: 'ID',
    example: 1,
  })
  @IsNumber()
  id: number;

  @ApiProperty({
    description: '用語',
    example: 'agile',
  })
  @IsString()
  term: string;

  @ApiProperty({
    description: '読み方',
    example: 'あじゃいる',
  })
  @IsString()
  reading: string;
}
