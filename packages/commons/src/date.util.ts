import * as dayjs from 'dayjs';
import * as timezone from 'dayjs/plugin/timezone';
import * as utc from 'dayjs/plugin/utc';

export const TIME_ZONE_UTC = 'UTC';
export const TIME_ZONE_JST = 'Asia/Tokyo';

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * 日付をフォーマットした文字列を返す
 * @param date Date
 * @param format 日付フォーマット
 * @param timezone タイムゾーン
 * @see https://day.js.org/docs/en/display/format
 * @returns フォーマットされた日付文字列
 */
export function formatDate(
  date: Date,
  format: string,
  timezone: string = TIME_ZONE_JST,
): string {
  if (!date) return '';
  return dayjs(date).tz(timezone).format(format);
}

/**
 * 指定の日数を減産した日付を返す
 * @param date 対象日付
 * @param days 減算する日数
 */
export function subtractDays(
  date: Date,
  days: number,
  timezone: string = TIME_ZONE_UTC,
): Date {
  return dayjs(date).tz(timezone).subtract(days, 'day').toDate();
}

/**
 * 前日の日付を返す
 * @param date 対象日付
 * @param timezone タイムゾーン
 * @returns 前日の日付
 */
export function getYesterday(
  date: Date = new Date(),
  timezone: string = TIME_ZONE_UTC,
): Date {
  return subtractDays(date, 1, timezone);
}

/**
 * 指定の日時に指定の分数を加算した日時を返す
 * @param date 対象日時
 * @param minutes 加算する分数
 * @param timezone タイムゾーン
 * @returns 加算後の日時
 */
export function addMinutes(
  date: Date,
  minutes: number,
  timezone: string = TIME_ZONE_UTC,
): Date {
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
 * 指定日時を基準にした前月の月初日を返す
 * @param date 対象日時
 * @param timezone タイムゾーン
 * @returns 前月の月初日
 */
export function getFirstDayOfPreviousMonth(
  date: Date,
  timezone: string = TIME_ZONE_UTC,
): Date {
  return dayjs(date).tz(timezone).subtract(1, 'month').startOf('month').toDate();
}

/**
 * 指定日時を基準にした前月の月末日を返す
 * @param date 対象日時
 * @param timezone タイムゾーン
 * @returns 前月の月末日
 */
export function getLastDayOfPreviousMonth(
  date: Date,
  timezone: string = TIME_ZONE_UTC,
): Date {
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
