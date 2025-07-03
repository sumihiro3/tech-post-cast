import { ApiProperty } from '@nestjs/swagger';

/**
 * RSSトークン再生成レスポンスDTO
 */
export class RegenerateRssTokenResponseDto {
  @ApiProperty({
    description: '新しく生成されたRSS配信用トークン',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  rssToken: string;

  @ApiProperty({
    description: '新しいRSS配信URL',
    example:
      'https://rss.techpostcast.com/u/550e8400-e29b-41d4-a716-446655440000/rss.xml',
  })
  rssUrl: string;

  @ApiProperty({
    description: 'トークン更新日時',
    example: '2024-01-15T10:30:00.000Z',
  })
  updatedAt: Date;
}
