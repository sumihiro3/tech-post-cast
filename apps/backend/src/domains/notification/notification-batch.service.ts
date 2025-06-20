import { AppConfigService } from '@/app-config/app-config.service';
import { IPersonalizedProgramAttemptsRepository } from '@domains/radio-program/personalized-feed/personalized-program-attempts.repository.interface';
import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  getStartOfDay,
  SlackNotificationService,
  TIME_ZONE_JST,
} from '@tech-post-cast/commons';

/**
 * 通知バッチ処理結果
 */
export interface NotificationBatchResult {
  /** 処理対象ユーザー数 */
  totalUsers: number;
  /** 通知送信成功ユーザー数 */
  successUsers: number;
  /** 通知送信失敗ユーザー数 */
  failedUsers: number;
  /** 処理対象レコード数 */
  totalAttempts: number;
  /** 処理開始時刻 */
  startedAt: Date;
  /** 処理完了時刻 */
  completedAt: Date;
}

/**
 * ユーザー通知処理結果
 */
interface UserNotificationResult {
  userId: string;
  success: boolean;
  error?: string;
  attemptIds: string[];
}

/**
 * 通知バッチサービス
 * パーソナルプログラム生成結果の定時通知を行う
 */
@Injectable()
export class NotificationBatchService {
  private readonly logger = new Logger(NotificationBatchService.name);

  constructor(
    private readonly appConfigService: AppConfigService,
    @Inject('PersonalizedProgramAttemptsRepository')
    private readonly personalizedProgramAttemptsRepository: IPersonalizedProgramAttemptsRepository,
  ) {}

  /**
   * 指定日の未通知レコードに対して通知を送信する
   * デフォルトでは当日分を処理する
   * @param targetDate 対象日（省略時は当日）
   * @returns 処理結果
   */
  async sendNotifications(targetDate?: Date): Promise<NotificationBatchResult> {
    const startedAt = new Date();
    const processDate = targetDate || getStartOfDay(new Date(), TIME_ZONE_JST);

    this.logger.log('通知バッチ処理を開始します', {
      targetDate: processDate,
      startedAt,
    });

    try {
      // 未通知レコードをユーザーごとに取得
      const userNotificationData =
        await this.personalizedProgramAttemptsRepository.findUnnotifiedDataByUser(
          processDate,
        );

      if (userNotificationData.length === 0) {
        this.logger.log('通知対象のレコードが見つかりませんでした', {
          targetDate: processDate,
        });
        return {
          totalUsers: 0,
          successUsers: 0,
          failedUsers: 0,
          totalAttempts: 0,
          startedAt,
          completedAt: new Date(),
        };
      }

      this.logger.log('通知対象データを取得しました', {
        userCount: userNotificationData.length,
        totalAttempts: userNotificationData.reduce(
          (sum, user) => sum + user.attempts.length,
          0,
        ),
      });

      // 各ユーザーに対して通知を送信
      const notificationResults: UserNotificationResult[] = [];
      for (const userData of userNotificationData) {
        const result = await this.sendUserNotification(userData);
        notificationResults.push(result);
      }

      // 結果を集計
      const completedAt = new Date();
      const successUsers = notificationResults.filter((r) => r.success).length;
      const failedUsers = notificationResults.filter((r) => !r.success).length;
      const totalAttempts = notificationResults.reduce(
        (sum, r) => sum + r.attemptIds.length,
        0,
      );
      const result: NotificationBatchResult = {
        totalUsers: userNotificationData.length,
        successUsers,
        failedUsers,
        totalAttempts,
        startedAt,
        completedAt,
      };
      this.logger.log('通知バッチ処理が完了しました', result);
      return result;
    } catch (error) {
      const errorMessage = '通知バッチ処理中にエラーが発生しました';
      this.logger.error(errorMessage, { error }, error.stack);
      throw error;
    }
  }

  /**
   * 個別ユーザーに対する通知送信処理
   * @param userData ユーザー通知データ
   * @returns 通知結果
   */
  private async sendUserNotification(
    userData: any,
  ): Promise<UserNotificationResult> {
    const { user, attempts } = userData;
    const attemptIds = attempts.map((attempt: any) => attempt.id);
    this.logger.debug('ユーザーへの通知処理を開始します', {
      userId: user.id,
      displayName: user.displayName,
      attemptCount: attempts.length,
    });

    try {
      // SlackNotificationServiceを使用してメッセージを構築
      const message =
        SlackNotificationService.buildPersonalProgramNotificationMessage(
          {
            displayName: user.displayName,
            attempts: attempts.map((attempt: any) => ({
              feedName: attempt.feed.name,
              status: attempt.status,
              reason: attempt.reason,
              postCount: attempt.postCount,
              program: attempt.program
                ? {
                    id: attempt.program.id,
                    title: attempt.program.title,
                    audioUrl: attempt.program.audioUrl,
                  }
                : null,
            })),
          },
          this.appConfigService.LpBaseUrl,
          this.appConfigService.ProgramAudioFileUrlPrefix,
        );

      // SlackNotificationServiceを使用して通知を送信
      const result = await SlackNotificationService.sendNotification(
        user.slackWebhookUrl,
        message,
      );

      if (!result.success) {
        throw new Error(result.error || 'Slack通知送信に失敗しました');
      }

      // 通知成功として記録
      await this.personalizedProgramAttemptsRepository.updateNotificationStatusBatch(
        attemptIds,
        true,
      );

      this.logger.log('ユーザー通知が成功しました', {
        userId: user.id,
        attemptCount: attempts.length,
        responseTime: result.responseTime,
      });

      return {
        userId: user.id,
        success: true,
        attemptIds,
      };
    } catch (error) {
      const errorMessage = `ユーザー [${user.id}] への通知送信に失敗しました`;
      this.logger.error(
        errorMessage,
        {
          error,
          webhookUrl: SlackNotificationService.maskWebhookUrl(
            user.slackWebhookUrl,
          ),
        },
        error.stack,
      );

      // 通知失敗として記録
      await this.personalizedProgramAttemptsRepository.updateNotificationStatusBatch(
        attemptIds,
        false,
        error.message,
      );

      return {
        userId: user.id,
        success: false,
        error: error.message,
        attemptIds,
      };
    }
  }
}
