import { BackendBearerTokenGuard } from '@/guards/bearer-token.guard';
import {
  NotificationBatchResult,
  NotificationBatchService,
} from '@domains/notification/notification-batch.service';
import {
  Controller,
  InternalServerErrorException,
  Logger,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { getYesterday, TIME_ZONE_JST } from '@tech-post-cast/commons';
import { Request } from 'express';

@Controller('notifications')
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(
    private readonly notificationBatchService: NotificationBatchService,
  ) {}

  /**
   * 通知バッチ処理のエンドポイント
   * Google Schedulerからの定時実行で呼び出される
   */
  @Post('batch')
  @ApiOperation({
    operationId: 'NotificationsController.sendBatchNotifications',
    summary: 'パーソナルプログラム生成結果の一括通知を送信する',
    description:
      'Google Schedulerからの定時実行で前日分の未通知レコードに対して通知を送信する',
  })
  @ApiHeader({
    name: 'Authorization',
    description: '認証トークン',
    example: 'Bearer xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: '通知バッチ処理結果',
    schema: {
      type: 'object',
      properties: {
        totalUsers: { type: 'number', description: '処理対象ユーザー数' },
        successUsers: { type: 'number', description: '通知送信成功ユーザー数' },
        failedUsers: { type: 'number', description: '通知送信失敗ユーザー数' },
        totalAttempts: { type: 'number', description: '処理対象レコード数' },
        startedAt: {
          type: 'string',
          format: 'date-time',
          description: '処理開始時刻',
        },
        completedAt: {
          type: 'string',
          format: 'date-time',
          description: '処理完了時刻',
        },
      },
    },
  })
  @UseGuards(BackendBearerTokenGuard)
  async sendBatchNotifications(
    @Req() request: Request,
  ): Promise<NotificationBatchResult> {
    this.logger.log('通知バッチ処理のリクエストを受信しました', {
      requestBody: request.body,
    });

    try {
      const targetDate = getYesterday(new Date(), TIME_ZONE_JST);
      this.logger.log(`通知バッチ処理を開始します`, {
        targetDate,
      });

      const result =
        await this.notificationBatchService.sendNotifications(targetDate);

      this.logger.log(`通知バッチ処理が完了しました`, result);
      return result;
    } catch (error) {
      const errorMessage = `通知バッチ処理中にエラーが発生しました`;
      this.logger.error(errorMessage, { error }, error.stack);
      throw new InternalServerErrorException(errorMessage);
    }
  }
}
