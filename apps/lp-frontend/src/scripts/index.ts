import type { HeadlineTopicProgram } from '@prisma/client';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(timezone);
dayjs.extend(utc);

const DATE_FORMAT = 'YYYY.M.D';

/**
 * ヘッドライントピック番組の一覧を取得する
 * @param count 取得する件数
 * @returns ヘッドライントピック番組の一覧
 */
export async function getHeadlineTopicProgramList(count: number): Promise<HeadlineTopicProgram[]> {
  console.debug('getHeadlineTopicProgramList called');
  const apiUrl = process.env.API_BASE_URL;
  const token = process.env.API_ACCESS_TOKEN;
  const lpUrl = process.env.LP_BASE_URL;
  console.log(`API_BASE_URL: ${apiUrl}`);
  console.log(`API_ACCESS_TOKEN: ${token}`);
  console.log(`ITEM_COUNT: ${count}`);
  if (!apiUrl || !token || !lpUrl) {
    console.warn(
      'API_BASE_URL または API_ACCESS_TOKEN または LP_BASE_URL が設定されていません',
    );
    return [];
  }
  const response = await fetch(
    `${apiUrl}/api/v1/headline-topic-programs?page=1&limit=${count}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token!}`,
      },
    },
  );
  const programs = (await response.json()) as HeadlineTopicProgram[];
  console.log(
    `ヘッドライントピック番組一覧（${programs.length}件）を取得しました`,
  );
  return programs;
}

/**
 * UTC の日付を日本時間の日付文字列に変換する
 * @param dt UTC の日付
 */
export function utcToJstDateString(dt: Date, format?: string): string {
  console.debug(`utcToJstDateString called!: [${dt}]`);
  try {
    const d = dayjs(dt).tz('Asia/Tokyo');
    return d.format(format ? format : DATE_FORMAT);
  }
  catch (error) {
    console.error(`UTC 日付の変換処理に失敗しました`, error);
    return dayjs(dt).toString();
  }
}
