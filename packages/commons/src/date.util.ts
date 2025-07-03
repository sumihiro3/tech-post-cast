import * as dayjs from 'dayjs';
import * as timezone from 'dayjs/plugin/timezone';
import * as utc from 'dayjs/plugin/utc';

export const TIME_ZONE_UTC = 'UTC';
export const TIME_ZONE_JST = 'Asia/Tokyo';

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * 指定の日時文字列を Date に変換する
 * @param dateString 日時文字列
 * @returns Date
 */
export function dateFromISOString(dateString: string): Date {
  return dayjs(dateString).toDate();
}

/**
 * 日付をフォーマットした文字列を返す
 * @param date Date
 * @param format 日付フォーマット
 * @param timezone タイムゾーン
 * @see https://day.js.org/docs/en/display/format
 * @returns フォーマットされた日付文字列
 */
export function formatDate(date: Date, format: string, timezone: string = TIME_ZONE_JST): string {
  if (!date) return '';
  return dayjs(date).tz(timezone).format(format);
}

/**
 * 指定の日数を加算した日付を返す
 * @param date 対象日付
 * @param days 加算する日数
 * @param timezone タイムゾーン
 * @returns 加算後の日付
 */
export function addDays(date: Date, days: number, timezone: string = TIME_ZONE_UTC): Date {
  return dayjs(date).tz(timezone).add(days, 'day').toDate();
}

/**
 * 指定の日数を減算した日付を返す
 * @param date 対象日付
 * @param days 減算する日数
 */
export function subtractDays(date: Date, days: number, timezone: string = TIME_ZONE_UTC): Date {
  return dayjs(date).tz(timezone).subtract(days, 'day').toDate();
}

/**
 * 前日の日付を返す
 * @param date 対象日付
 * @param timezone タイムゾーン
 * @returns 前日の日付
 */
export function getYesterday(date: Date = new Date(), timezone: string = TIME_ZONE_UTC): Date {
  return subtractDays(date, 1, timezone);
}

/**
 * 指定の日時に指定の分数を加算した日時を返す
 * @param date 対象日時
 * @param minutes 加算する分数
 * @param timezone タイムゾーン
 * @returns 加算後の日時
 */
export function addMinutes(date: Date, minutes: number, timezone: string = TIME_ZONE_UTC): Date {
  return dayjs(date).tz(timezone).add(minutes, 'minute').toDate();
}

/**
 * 指定日付の 0:00 の日時を返す
 * @param dateString 日付文字列
 * @param timezone タイムゾーン
 * @returns 指定日付の 0:00 の日時
 */
export function getStartOfDayFromString(
  dateString: string,
  timezone: string = TIME_ZONE_UTC,
): Date {
  return dayjs(dateString).tz(timezone).startOf('day').toDate();
}

/**
 * 指定日 0:00 の日時を返す
 * @param date 対象日時
 * @param timezone タイムゾーン
 * @returns 指定日 0:00 の日時
 */
export function getStartOfDay(date: Date, timezone: string = TIME_ZONE_UTC): Date {
  return dayjs(date).tz(timezone).startOf('day').toDate();
}

/**
 * 指定日 23:59:59.999 の日時を返す
 * @param date 対象日時
 * @param timezone タイムゾーン
 * @returns 指定日 23:59:59.999 の日時
 */
export function getEndOfDay(date: Date, timezone: string = TIME_ZONE_UTC): Date {
  return dayjs(date).tz(timezone).endOf('day').toDate();
}

/**
 * 指定日時を基準にした前月の月初日を返す
 * @param date 対象日時
 * @param timezone タイムゾーン
 * @returns 前月の月初日
 */
export function getFirstDayOfPreviousMonth(date: Date, timezone: string = TIME_ZONE_UTC): Date {
  return dayjs(date).tz(timezone).subtract(1, 'month').startOf('month').toDate();
}

/**
 * 指定日時を基準にした前月の月末日を返す
 * @param date 対象日時
 * @param timezone タイムゾーン
 * @returns 前月の月末日
 */
export function getLastDayOfPreviousMonth(date: Date, timezone: string = TIME_ZONE_UTC): Date {
  return dayjs(date).tz(timezone).subtract(1, 'month').endOf('month').toDate();
}

/**
 * 指定日時を基準にした当月の月初日を返す
 * @param date 対象日時
 * @param timezone タイムゾーン
 * @returns 当月の月初日
 */
export function getFirstDayOfMonth(date: Date, timezone: string = TIME_ZONE_UTC): Date {
  return dayjs(date).tz(timezone).startOf('month').toDate();
}

/**
 * 指定日時を基準にした当月の月末日を返す
 * @param date 対象日時
 * @param timezone タイムゾーン
 * @returns 当月の月末日
 */
export function getLastDayOfMonth(date: Date, timezone: string = TIME_ZONE_UTC): Date {
  return dayjs(date).tz(timezone).endOf('month').toDate();
}

/**
 * 指定日時の分数を返す
 * @param date 対象日時
 * @param timezone タイムゾーン
 * @returns 指定日時の分数
 */
export function getMinutes(date: Date, timezone: string = TIME_ZONE_UTC): number {
  return dayjs(date).tz(timezone).minute();
}

/**
 * 指定日を含めた過去指定日数分の日付を取得する
 * @param baseDate 指定日
 * @param days 指定日数
 * @returns 指定日を含めた過去指定日数分の日付一覧
 */
export function getDates(baseDate: Date, days: number): Date[] {
  const dates: Date[] = [];
  for (let i = 0; i < days; i++) {
    const date = dayjs(baseDate).subtract(i, 'day').toDate();
    dates.push(date);
  }
  return dates;
}

/**
 * 指定日時の cron expression を返す
 * @param date cron 実行日時
 * @returns cron expression
 */
export function getCronExpression(date: Date): string {
  const d = dayjs(date).tz(TIME_ZONE_UTC);
  return `cron(${d.minute()} ${d.hour()} ${d.date()} ${d.month() + 1} ? ${d.year()})`;
}

/**
 * 指定日付の年月日・曜日での表示文字列を取得する
 * @param target Date
 * @returns 日付（年月日、曜日）
 */
export function getJapaneseDateStringWithWeekday(target: Date): string {
  // 日本語での日付表記
  const date = dayjs(target).format('YYYY年MM月DD日（ddd）');
  return date;
}

/**
 * 指定日時を基準にした当週の開始日（月曜日）を返す
 * @param date 対象日時
 * @param timezone タイムゾーン
 * @returns 当週の開始日（月曜日）
 */
export function getFirstDayOfWeek(date: Date, timezone: string = TIME_ZONE_UTC): Date {
  return dayjs(date).tz(timezone).startOf('week').add(1, 'day').toDate(); // 月曜日を週の開始とする
}

/**
 * 指定日時を基準にした当週の終了日（日曜日）を返す
 * @param date 対象日時
 * @param timezone タイムゾーン
 * @returns 当週の終了日（日曜日）
 */
export function getLastDayOfWeek(date: Date, timezone: string = TIME_ZONE_UTC): Date {
  return dayjs(date).tz(timezone).endOf('week').toDate();
}

/**
 * 指定日時を基準にした前週の開始日（月曜日）を返す
 * @param date 対象日時
 * @param timezone タイムゾーン
 * @returns 前週の開始日（月曜日）
 */
export function getFirstDayOfPreviousWeek(date: Date, timezone: string = TIME_ZONE_UTC): Date {
  return dayjs(date).tz(timezone).subtract(1, 'week').startOf('week').add(1, 'day').toDate();
}

/**
 * 指定日時を基準にした前週の終了日（日曜日）を返す
 * @param date 対象日時
 * @param timezone タイムゾーン
 * @returns 前週の終了日（日曜日）
 */
export function getLastDayOfPreviousWeek(date: Date, timezone: string = TIME_ZONE_UTC): Date {
  return dayjs(date).tz(timezone).subtract(1, 'week').endOf('week').toDate();
}

/**
 * 指定された日付が今日かどうかを判定する
 * @param date 対象日付
 * @param timezone タイムゾーン
 * @returns 今日の場合true
 */
export function isToday(date: Date, timezone: string = TIME_ZONE_JST): boolean {
  const today = dayjs().tz(timezone).startOf('day');
  const targetDate = dayjs(date).tz(timezone).startOf('day');
  return today.isSame(targetDate);
}

/**
 * 指定された日付が今週かどうかを判定する
 * @param date 対象日付
 * @param timezone タイムゾーン
 * @returns 今週の場合true
 */
export function isThisWeek(date: Date, timezone: string = TIME_ZONE_JST): boolean {
  const thisWeekStart = getFirstDayOfWeek(new Date(), timezone);
  const thisWeekEnd = getLastDayOfWeek(new Date(), timezone);
  const targetDate = dayjs(date).tz(timezone);
  return targetDate.isAfter(thisWeekStart) && targetDate.isBefore(thisWeekEnd);
}

/**
 * 指定された日付が今月かどうかを判定する
 * @param date 対象日付
 * @param timezone タイムゾーン
 * @returns 今月の場合true
 */
export function isThisMonth(date: Date, timezone: string = TIME_ZONE_JST): boolean {
  const thisMonthStart = getFirstDayOfMonth(new Date(), timezone);
  const thisMonthEnd = getLastDayOfMonth(new Date(), timezone);
  const targetDate = dayjs(date).tz(timezone);
  return targetDate.isAfter(thisMonthStart) && targetDate.isBefore(thisMonthEnd);
}

/**
 * 相対的な日付表示文字列を取得する（例：「今日」「昨日」「3日前」）
 * @param date 対象日付
 * @param timezone タイムゾーン
 * @returns 相対日付文字列
 */
export function getRelativeDateString(date: Date, timezone: string = TIME_ZONE_JST): string {
  const now = dayjs().tz(timezone);
  const target = dayjs(date).tz(timezone);
  const diffDays = now.diff(target, 'day');

  if (diffDays === 0) return '今日';
  if (diffDays === 1) return '昨日';
  if (diffDays === 2) return '一昨日';
  if (diffDays <= 7) return `${diffDays}日前`;
  if (diffDays <= 30) return `${Math.floor(diffDays / 7)}週間前`;
  if (diffDays <= 365) return `${Math.floor(diffDays / 30)}ヶ月前`;
  return `${Math.floor(diffDays / 365)}年前`;
}

/**
 * 期間の長さを人間が読みやすい形式で取得する
 * @param startDate 開始日
 * @param endDate 終了日
 * @param timezone タイムゾーン
 * @returns 期間文字列（例：「3日間」「2週間」「1ヶ月」）
 */
export function getDurationString(
  startDate: Date,
  endDate: Date,
  timezone: string = TIME_ZONE_JST,
): string {
  const start = dayjs(startDate).tz(timezone);
  const end = dayjs(endDate).tz(timezone);
  const diffDays = end.diff(start, 'day');

  if (diffDays === 0) return '当日';
  if (diffDays === 1) return '1日間';
  if (diffDays < 7) return `${diffDays}日間`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    const remainingDays = diffDays % 7;
    if (remainingDays === 0) return `${weeks}週間`;
    return `${weeks}週間${remainingDays}日`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `約${months}ヶ月`;
  }
  const years = Math.floor(diffDays / 365);
  return `約${years}年`;
}
