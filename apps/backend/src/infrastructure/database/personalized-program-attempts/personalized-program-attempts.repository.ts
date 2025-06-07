import {
  PersonalizedProgramNotificationDataError,
  PersonalizedProgramNotificationStatusUpdateError,
} from '@/types/errors';
import {
  IPersonalizedProgramAttemptsRepository,
  NotificationStatusUpdate,
  UserNotificationData,
} from '@domains/radio-program/personalized-feed/personalized-program-attempts.repository.interface';
import { Injectable, Logger } from '@nestjs/common';
import {
  getEndOfDay,
  getStartOfDay,
  TIME_ZONE_JST,
} from '@tech-post-cast/commons';
import {
  PersonalizedProgramAttemptWithNotificationData,
  PrismaClientManager,
} from '@tech-post-cast/database';

@Injectable()
export class PersonalizedProgramAttemptsRepository
  implements IPersonalizedProgramAttemptsRepository
{
  private readonly logger = new Logger(
    PersonalizedProgramAttemptsRepository.name,
  );

  constructor(private readonly prisma: PrismaClientManager) {}

  /**
   * 指定日の未通知レコードを取得し、ユーザーごとに集約する
   * @param targetDate 対象日
   * @returns ユーザーごとの通知対象データ
   */
  async findUnnotifiedDataByUser(
    targetDate: Date,
  ): Promise<UserNotificationData[]> {
    this.logger.debug(
      `PersonalizedProgramAttemptsRepository.findUnnotifiedDataByUser called`,
      { targetDate },
    );

    // 日付範囲を計算
    const startOfDay = getStartOfDay(targetDate, TIME_ZONE_JST);
    const endOfDay = getEndOfDay(targetDate, TIME_ZONE_JST);
    this.logger.debug(
      `未通知レコード取得: ${startOfDay.toISOString()} - ${endOfDay.toISOString()}`,
    );

    try {
      const client = this.prisma.getClient();
      // 指定日の未通知レコードを取得
      const unnotifiedAttempts =
        await client.personalizedProgramAttempt.findMany({
          where: {
            createdAt: {
              gte: startOfDay,
              lte: endOfDay,
            },
            notified: false,
          },
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                slackWebhookUrl: true,
                notificationEnabled: true,
              },
            },
            feed: {
              select: {
                id: true,
                name: true,
              },
            },
            program: {
              select: {
                id: true,
                title: true,
                audioUrl: true,
              },
            },
          },
          orderBy: [{ userId: 'asc' }, { createdAt: 'asc' }],
        });

      this.logger.debug(
        `取得した未通知レコード数: ${unnotifiedAttempts.length}`,
      );
      if (unnotifiedAttempts.length === 0) {
        this.logger.warn('未通知レコードが見つかりませんでした');
        return [];
      }

      // ユーザーごとにデータを集約
      const userDataMap = this.aggregateByUser(unnotifiedAttempts);

      // 通知可能なユーザーのみをフィルタリング
      const notifiableUsers = this.filterNotifiableUsers(userDataMap);

      this.logger.debug(`通知対象ユーザー数: ${notifiableUsers.length}`);

      return notifiableUsers;
    } catch (error) {
      const errorMessage = `未通知レコード取得に失敗しました`;
      this.logger.error(errorMessage, {
        error,
        targetDate,
      });
      if (error instanceof Error) {
        this.logger.error(error.message, error.stack);
      }
      throw new PersonalizedProgramNotificationDataError(errorMessage, {
        cause: error,
      });
    }
  }

  /**
   * 通知ステータスを更新する
   * @param updates 更新対象のattempt ID配列と通知ステータス
   */
  async updateNotificationStatus(
    updates: NotificationStatusUpdate[],
  ): Promise<void> {
    this.logger.debug(
      `PersonalizedProgramAttemptsRepository.updateNotificationStatus called`,
      { updatesCount: updates.length },
    );

    try {
      await this.prisma.transaction(async () => {
        const client = this.prisma.getClient();
        for (const update of updates) {
          await client.personalizedProgramAttempt.updateMany({
            where: {
              id: {
                in: update.attemptIds,
              },
            },
            data: {
              notified: true,
              notifiedAt: new Date(),
              notificationSuccess: update.success,
              notificationError: update.error || null,
            },
          });
        }
      });

      const totalUpdated = updates.reduce(
        (sum, update) => sum + update.attemptIds.length,
        0,
      );
      this.logger.debug(
        `パーソナルプログラム生成通知のステータス更新が完了しました: ${totalUpdated}件`,
      );
    } catch (error) {
      const errorMessage = `通知ステータス更新に失敗しました`;
      this.logger.error(errorMessage, {
        error,
        updatesCount: updates.length,
      });
      if (error instanceof Error) {
        this.logger.error(error.message, error.stack);
      }
      throw new PersonalizedProgramNotificationStatusUpdateError(errorMessage, {
        cause: error,
      });
    }
  }

  /**
   * 複数のattemptの通知ステータスを一括更新する
   * @param attemptIds 更新対象のattempt ID配列
   * @param success 通知送信成功フラグ
   * @param error エラーメッセージ（失敗時のみ）
   */
  async updateNotificationStatusBatch(
    attemptIds: string[],
    success: boolean,
    error?: string,
  ): Promise<void> {
    this.logger.debug(
      `PersonalizedProgramAttemptsRepository.updateNotificationStatusBatch called`,
      { attemptIdsCount: attemptIds.length, success },
    );

    try {
      const client = this.prisma.getClient();
      await client.personalizedProgramAttempt.updateMany({
        where: {
          id: {
            in: attemptIds,
          },
        },
        data: {
          notified: true,
          notifiedAt: new Date(),
          notificationSuccess: success,
          notificationError: error || null,
        },
      });

      this.logger.debug(
        `パーソナルプログラム生成通知のステータス更新が完了しました: ${attemptIds.length}件, 成功=${success}`,
      );
    } catch (updateError) {
      const errorMessage = `パーソナルプログラム生成通知のステータス更新に失敗しました`;
      this.logger.error(errorMessage, {
        error: updateError,
        attemptIdsCount: attemptIds.length,
        success,
      });
      if (updateError instanceof Error) {
        this.logger.error(updateError.message, updateError.stack);
      }
      throw new PersonalizedProgramNotificationStatusUpdateError(errorMessage, {
        cause: updateError,
      });
    }
  }

  /**
   * ユーザーごとにデータを集約
   * @param attempts パーソナルプログラム生成通知の試行データ
   * @returns ユーザーごとのデータ
   */
  private aggregateByUser(
    attempts: PersonalizedProgramAttemptWithNotificationData[],
  ): Map<string, UserNotificationData> {
    const userDataMap = new Map<string, UserNotificationData>();

    for (const attempt of attempts) {
      const userId = attempt.userId;

      if (!userDataMap.has(userId)) {
        userDataMap.set(userId, {
          userId,
          user: {
            displayName: attempt.user.displayName,
            slackWebhookUrl: attempt.user.slackWebhookUrl,
            notificationEnabled: attempt.user.notificationEnabled,
          },
          attempts: [],
        });
      }

      const userData = userDataMap.get(userId)!;
      userData.attempts.push(attempt);
    }

    return userDataMap;
  }

  /**
   * 通知可能なユーザーのみをフィルタリング
   * 通知が有効で、Slack Webhook URLが設定されているユーザーのみ
   * @param userDataMap ユーザーごとのデータ
   * @returns 通知可能なユーザーのみのデータ
   */
  private filterNotifiableUsers(
    userDataMap: Map<string, UserNotificationData>,
  ): UserNotificationData[] {
    const notifiableUsers: UserNotificationData[] = [];

    for (const userData of userDataMap.values()) {
      // 通知が有効で、Slack Webhook URLが設定されているユーザーのみ
      if (userData.user.notificationEnabled && userData.user.slackWebhookUrl) {
        notifiableUsers.push(userData);
      } else {
        this.logger.debug(
          `ユーザー ${userData.userId} は通知対象外: ` +
            `notificationEnabled=${userData.user.notificationEnabled}, ` +
            `hasSlackWebhook=${!!userData.user.slackWebhookUrl}`,
        );
      }
    }

    return notifiableUsers;
  }
}
