import { BackendBearerTokenGuard } from '@/guards/bearer-token.guard';
import { NotificationBatchService } from '@domains/notification/notification-batch.service';
import {
  Controller,
  InternalServerErrorException,
  Logger,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { getStartOfDay, TIME_ZONE_JST } from '@tech-post-cast/commons';
import { Request } from 'express';
import { NotificationBatchResultDto } from './dto/notification.dto';

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
    description: '定時に実行され、当日分の未通知レコードに対して通知を送信する',
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
    type: NotificationBatchResultDto,
  })
  @UseGuards(BackendBearerTokenGuard)
  async sendBatchNotifications(
    @Req() request: Request,
  ): Promise<NotificationBatchResultDto> {
    this.logger.debug(
      'NotificationsController.sendBatchNotifications called!',
      {
        requestBody: request.body,
      },
    );

    try {
      const targetDate = getStartOfDay(new Date(), TIME_ZONE_JST);
      this.logger.log(`通知バッチ処理を開始します`, {
        targetDate,
      });

      const result =
        await this.notificationBatchService.sendNotifications(targetDate);

      this.logger.log(`通知バッチ処理が完了しました`, result);
      return NotificationBatchResultDto.createFrom(result);
    } catch (error) {
      const errorMessage = `通知バッチ処理中にエラーが発生しました`;
      this.logger.error(errorMessage, { error }, error.stack);
      throw new InternalServerErrorException(errorMessage);
    }
  }
}
