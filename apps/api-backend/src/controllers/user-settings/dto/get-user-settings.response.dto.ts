import { ApiProperty } from '@nestjs/swagger';

/**
 * ユーザー設定取得レスポンスDTO
 */
export class GetUserSettingsResponseDto {
  @ApiProperty({
    description: 'ユーザーID',
    example: 'user_01234567890abcdef',
  })
  userId: string;

  @ApiProperty({
    description: 'パーソナルプログラム内で使用される表示名',
    example: '田中 太郎',
  })
  displayName: string;

  @ApiProperty({
    description: '個別のSlack Webhook URL（番組生成完了時の通知用）',
    example:
      'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
    required: false,
  })
  slackWebhookUrl?: string;

  @ApiProperty({
    description: '通知が有効かどうかを表すフラグ',
    example: true,
  })
  notificationEnabled: boolean;

  @ApiProperty({
    description: 'RSS機能が有効かどうかを表すフラグ',
    example: false,
  })
  rssEnabled: boolean;

  @ApiProperty({
    description: 'RSS配信用のトークン（RSS機能が有効な場合のみ）',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  rssToken?: string;

  @ApiProperty({
    description: 'RSS配信URL（RSS機能が有効な場合のみ）',
    example:
      'https://rss.techpostcast.com/u/550e8400-e29b-41d4-a716-446655440000/rss.xml',
    required: false,
  })
  rssUrl?: string;

  @ApiProperty({
    description:
      '複数話者モードでのパーソナルプログラムを作成できるかどうかを表すフラグ',
    example: false,
  })
  personalizedProgramDialogueEnabled: boolean;

  @ApiProperty({
    description: '設定の最終更新日時',
    example: '2024-01-15T10:30:00.000Z',
  })
  updatedAt: Date;
}
