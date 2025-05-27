import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

/**
 * ユーザー設定更新リクエストDTO
 */
export class UpdateUserSettingsRequestDto {
  @ApiProperty({
    description: 'パーソナルプログラム内で使用される表示名',
    example: '田中 太郎',
    required: false,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: '表示名は100文字以内で入力してください' })
  displayName?: string;

  @ApiProperty({
    description: '個別のSlack Webhook URL（番組生成完了時の通知用）',
    example:
      'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Matches(/^$|^https:\/\/hooks\.slack\.com\/services\/.*/, {
    message: '有効なSlack Webhook URLを入力してください（空文字も可）',
  })
  @MaxLength(500, {
    message: 'Slack Webhook URLは500文字以内で入力してください',
  })
  slackWebhookUrl?: string;

  @ApiProperty({
    description: '通知が有効かどうかを表すフラグ',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  notificationEnabled?: boolean;
}
