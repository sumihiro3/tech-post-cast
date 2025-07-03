import { PersonalizedProgramAttempt } from '@prisma/client';
import { PersonalizedProgramAttemptStatus } from '@tech-post-cast/database';

/**
 * パーソナライズ番組生成試行のモックデータを作成するファクトリークラス
 */
export class PersonalizedProgramAttemptFactory {
  /**
   * 単一のパーソナライズ番組生成試行モックデータを作成する
   * @param overrides 上書きするプロパティ
   * @returns PersonalizedProgramAttempt
   */
  static createPersonalizedProgramAttempt(
    overrides: Partial<PersonalizedProgramAttempt> = {},
  ): PersonalizedProgramAttempt {
    const defaultAttempt: PersonalizedProgramAttempt = {
      id: 'attempt-1',
      userId: 'user-1',
      feedId: 'feed-1',
      status: PersonalizedProgramAttemptStatus.SUCCESS,
      reason: null,
      postCount: 3,
      programId: 'program-1',
      createdAt: new Date('2024-01-01'),
      // 通知関連フィールド
      notified: false,
      notifiedAt: null,
      notificationSuccess: null,
      notificationError: null,
    };

    return {
      ...defaultAttempt,
      ...overrides,
    };
  }

  /**
   * 複数のパーソナライズ番組生成試行モックデータを作成する
   * @param count 作成する試行数
   * @param overrides 上書きするプロパティ
   * @returns PersonalizedProgramAttempt[]
   */
  static createPersonalizedProgramAttempts(
    count: number,
    overrides: Partial<PersonalizedProgramAttempt> = {},
  ): PersonalizedProgramAttempt[] {
    return Array.from({ length: count }, (_, index) =>
      this.createPersonalizedProgramAttempt({
        id: `attempt-${index + 1}`,
        programId: `program-${index + 1}`,
        createdAt: new Date(`2024-01-${String(index + 1).padStart(2, '0')}`),
        ...overrides,
      }),
    );
  }

  /**
   * 成功した番組生成試行モックデータを作成する
   * @param overrides 上書きするプロパティ
   * @returns PersonalizedProgramAttempt
   */
  static createSuccessfulAttempt(
    overrides: Partial<PersonalizedProgramAttempt> = {},
  ): PersonalizedProgramAttempt {
    return this.createPersonalizedProgramAttempt({
      status: PersonalizedProgramAttemptStatus.SUCCESS,
      reason: null,
      postCount: 3,
      programId: 'program-1',
      ...overrides,
    });
  }

  /**
   * スキップされた番組生成試行モックデータを作成する
   * @param overrides 上書きするプロパティ
   * @returns PersonalizedProgramAttempt
   */
  static createSkippedAttempt(
    overrides: Partial<PersonalizedProgramAttempt> = {},
  ): PersonalizedProgramAttempt {
    return this.createPersonalizedProgramAttempt({
      status: PersonalizedProgramAttemptStatus.SKIPPED,
      reason: 'NOT_ENOUGH_POSTS',
      postCount: 1,
      programId: null,
      ...overrides,
    });
  }

  /**
   * 失敗した番組生成試行モックデータを作成する
   * @param overrides 上書きするプロパティ
   * @returns PersonalizedProgramAttempt
   */
  static createFailedAttempt(
    overrides: Partial<PersonalizedProgramAttempt> = {},
  ): PersonalizedProgramAttempt {
    return this.createPersonalizedProgramAttempt({
      status: PersonalizedProgramAttemptStatus.FAILED,
      reason: 'UPLOAD_ERROR',
      postCount: 2,
      programId: null,
      ...overrides,
    });
  }

  /**
   * 特定のフィードIDに対する番組生成試行モックデータを作成する
   * @param feedId フィードID
   * @param count 作成する試行数
   * @param overrides 上書きするプロパティ
   * @returns PersonalizedProgramAttempt[]
   */
  static createAttemptsForFeed(
    feedId: string,
    count: number,
    overrides: Partial<PersonalizedProgramAttempt> = {},
  ): PersonalizedProgramAttempt[] {
    return this.createPersonalizedProgramAttempts(count, {
      feedId,
      ...overrides,
    });
  }

  /**
   * 特定のユーザーIDに対する番組生成試行モックデータを作成する
   * @param userId ユーザーID
   * @param count 作成する試行数
   * @param overrides 上書きするプロパティ
   * @returns PersonalizedProgramAttempt[]
   */
  static createAttemptsForUser(
    userId: string,
    count: number,
    overrides: Partial<PersonalizedProgramAttempt> = {},
  ): PersonalizedProgramAttempt[] {
    return this.createPersonalizedProgramAttempts(count, {
      userId,
      ...overrides,
    });
  }

  /**
   * 様々なステータスの番組生成試行モックデータを作成する
   * @param overrides 上書きするプロパティ
   * @returns PersonalizedProgramAttempt[]
   */
  static createMixedStatusAttempts(
    overrides: Partial<PersonalizedProgramAttempt> = {},
  ): PersonalizedProgramAttempt[] {
    return [
      this.createSuccessfulAttempt({
        id: 'attempt-1',
        createdAt: new Date('2024-01-03'),
        ...overrides,
      }),
      this.createSkippedAttempt({
        id: 'attempt-2',
        createdAt: new Date('2024-01-02'),
        ...overrides,
      }),
      this.createFailedAttempt({
        id: 'attempt-3',
        createdAt: new Date('2024-01-01'),
        ...overrides,
      }),
    ];
  }

  /**
   * 時系列順の番組生成試行モックデータを作成する
   * @param count 作成する試行数
   * @param startDate 開始日
   * @param overrides 上書きするプロパティ
   * @returns PersonalizedProgramAttempt[]
   */
  static createTimeSeriesAttempts(
    count: number,
    startDate: Date = new Date('2024-01-01'),
    overrides: Partial<PersonalizedProgramAttempt> = {},
  ): PersonalizedProgramAttempt[] {
    return Array.from({ length: count }, (_, index) => {
      const attemptDate = new Date(startDate);
      attemptDate.setDate(attemptDate.getDate() + index);

      return this.createPersonalizedProgramAttempt({
        id: `attempt-${index + 1}`,
        createdAt: attemptDate,
        ...overrides,
      });
    });
  }
}
