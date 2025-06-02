import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl, MaxLength } from 'class-validator';

/**
 * Slack Webhook URLテストリクエストDTO
 */
export class TestSlackWebhookRequestDto {
  @ApiProperty({
    description: 'テストするSlack Webhook URL',
    example:
      'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
    maxLength: 500,
  })
  @IsNotEmpty({ message: 'Slack Webhook URLは必須です' })
  @IsString()
  @IsUrl({}, { message: '有効なURL形式で入力してください' })
  @MaxLength(500, {
    message: 'Slack Webhook URLは500文字以内で入力してください',
  })
  webhookUrl: string;
}
