import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';
import { NotificationBatchResult } from '../../../domains/notification/notification-batch.service';

/**
 * 通知バッチ処理結果を表す DTO
 */
export class NotificationBatchResultDto {
  /** 処理対象ユーザー数 */
  @ApiProperty({
    description: '処理対象ユーザー数',
    example: 10,
    required: true,
  })
  @IsNumber()
  totalUsers: number;
  /** 通知送信成功ユーザー数 */
  @ApiProperty({
    description: '通知送信成功ユーザー数',
    example: 8,
    required: true,
  })
  @IsNumber()
  successUsers: number;
  /** 通知送信失敗ユーザー数 */
  @ApiProperty({
    description: '通知送信失敗ユーザー数',
    example: 2,
    required: true,
  })
  @IsNumber()
  failedUsers: number;
  /** 処理対象レコード数 */
  @ApiProperty({
    description: '処理対象レコード数',
    example: 12,
    required: true,
  })
  @IsNumber()
  totalAttempts: number;
  /** 処理開始時刻 */
  @ApiProperty({
    description: '処理開始時刻',
    required: true,
  })
  startedAt: Date;
  /** 処理完了時刻 */
  @ApiProperty({
    description: '処理完了時刻',
    required: true,
  })
  completedAt: Date;

  /**
   * NotificationBatchResult からインスタンスを生成する
   * @param data NotificationBatchResult
   * @returns NotificationBatchResultDto
   */
  static createFrom(data: NotificationBatchResult): NotificationBatchResultDto {
    const dto = new NotificationBatchResultDto();
    dto.totalUsers = data.totalUsers;
    dto.successUsers = data.successUsers;
    dto.failedUsers = data.failedUsers;
    dto.totalAttempts = data.totalAttempts;
    dto.startedAt = dto.startedAt;
    dto.completedAt = dto.completedAt;
    return dto;
  }
}
