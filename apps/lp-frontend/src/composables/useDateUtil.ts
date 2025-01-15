import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(timezone);
dayjs.extend(utc);

const DATE_TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';
const DATE_FORMAT = 'YYYY-M-D';

export const useDateUtil = () => {
  /**
   * タイムスタンプから日付文字列に変換する
   * @param timestamp Unix Timestamp * 1000
   * @param format dayjs で定めるフォーマット https://day.js.org/docs/en/display/format
   * @returns 日付文字列
   */
  const timestampToDateTimeString = (
    timestamp: number,
    format?: string,
  ): string => {
    console.debug(
      `useDateUtil.timestampToDateTimeString called!: [${timestamp}] [${format}]`,
    );
    try {
      const d = dayjs(timestamp).tz('Asia/Tokyo');
      return d.format(format ? format : DATE_TIME_FORMAT);
    } catch (error) {
      console.error(`タイムスタンプの変換処理に失敗しました`, error);
      return dayjs(timestamp).toString();
    }
  };

  /**
   * UTC の日付文字列を日本時間の日付文字列に変換する
   * @param dateString UTC の日付文字列
   */
  const utcToJstDateString = (dateString: string, format?: string): string => {
    console.debug(`useDateUtil.utcToJstDateString called!: [${dateString}]`);
    try {
      const d = dayjs.utc(dateString).tz('Asia/Tokyo');
      return d.format(format ? format : DATE_FORMAT);
    } catch (error) {
      console.error(`UTC の日付文字列の変換処理に失敗しました`, error);
      return dayjs.utc(dateString).toString();
    }
  };

  return {
    timestampToDateTimeString,
    utcToJstDateString,
  };
};
