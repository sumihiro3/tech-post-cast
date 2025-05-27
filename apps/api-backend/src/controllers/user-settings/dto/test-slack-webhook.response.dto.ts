import { ApiProperty } from '@nestjs/swagger';

/**
 * Slack Webhook URLテストレスポンスDTO
 */
export class TestSlackWebhookResponseDto {
  @ApiProperty({
    description: 'テストが成功したかどうか',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'エラーメッセージ（失敗時）',
    example: 'Slack API エラー: 404 Not Found',
    required: false,
  })
  errorMessage?: string;

  @ApiProperty({
    description: 'レスポンス時間（ミリ秒）',
    example: 1250,
  })
  responseTime: number;
}
