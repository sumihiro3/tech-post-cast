import * as dayjs from 'dayjs';
import {
  TIME_ZONE_JST,
  TIME_ZONE_UTC,
  addMinutes,
  formatDate,
  getCronExpression,
  getDates,
  getDurationString,
  getFirstDayOfMonth,
  getFirstDayOfPreviousMonth,
  getFirstDayOfPreviousWeek,
  getFirstDayOfWeek,
  getLastDayOfMonth,
  getLastDayOfPreviousMonth,
  getLastDayOfPreviousWeek,
  getLastDayOfWeek,
  getMinutes,
  getRelativeDateString,
  getStartOfDay,
  getStartOfDayFromString,
  getYesterday,
  isThisMonth,
  isThisWeek,
  isToday,
} from './date.util';

describe('first', () => {
  it('formatDate', () => {
    const date = new Date('2024-01-01T12:00:00.000Z');
    const formattedDateUTC = '20240101120000';
    const formattedDateJST = '20240101210000';
    // execute
    const resultUTC = formatDate(date, 'YYYYMMDDHHmmss', TIME_ZONE_UTC);
    const resultJST = formatDate(date, 'YYYYMMDDHHmmss', TIME_ZONE_JST);
    // verify
    expect(resultUTC).toEqual(formattedDateUTC);
    expect(resultJST).toEqual(formattedDateJST);
  });

  it('getYesterday', () => {
    const date = new Date('2024-01-01T12:00:00.000Z');
    // execute
    const resultUTC = getYesterday(date, TIME_ZONE_UTC);
    const resultJST = getYesterday(date, TIME_ZONE_JST);
    // verify
    expect(resultUTC).toEqual(dayjs(date).tz(TIME_ZONE_UTC).subtract(1, 'day').toDate());
    expect(resultJST).toEqual(dayjs(date).tz(TIME_ZONE_JST).subtract(1, 'day').toDate());
  });

  it('addMinutes', () => {
    const date = new Date('2024-01-01T12:00:00.000Z');
    const minutes = 30;
    // execute
    const resultUTC = addMinutes(date, minutes, TIME_ZONE_UTC);
    const resultJST = addMinutes(date, minutes, TIME_ZONE_JST);
    // verify
    expect(resultUTC).toEqual(dayjs(date).tz(TIME_ZONE_UTC).add(minutes, 'minute').toDate());
    expect(resultJST).toEqual(dayjs(date).tz(TIME_ZONE_JST).add(minutes, 'minute').toDate());
  });

  it('getStartOfDayFromString', () => {
    const dateString = '20240101';
    // execute
    const resultUTC = getStartOfDayFromString(dateString, TIME_ZONE_UTC);
    const resultJST = getStartOfDayFromString(dateString, TIME_ZONE_JST);
    // verify
    expect(resultUTC).toEqual(dayjs(dateString).tz(TIME_ZONE_UTC).startOf('day').toDate());
    expect(resultJST).toEqual(dayjs(dateString).tz(TIME_ZONE_JST).startOf('day').toDate());
  });

  it('getStartOfDay', () => {
    const date = new Date('2024-01-01T12:00:00.000Z');
    // execute
    const resultUTC = getStartOfDay(date, TIME_ZONE_UTC);
    const resultJST = getStartOfDay(date, TIME_ZONE_JST);
    // verify
    expect(resultUTC).toEqual(dayjs(date).tz(TIME_ZONE_UTC).startOf('day').toDate());
    expect(resultJST).toEqual(dayjs(date).tz(TIME_ZONE_JST).startOf('day').toDate());
  });

  it('getFirstDayOfPreviousMonth', () => {
    const date = new Date('2024-01-01T12:00:00.000Z');
    // execute
    const resultUTC = getFirstDayOfPreviousMonth(date, TIME_ZONE_UTC);
    const resultJST = getFirstDayOfPreviousMonth(date, TIME_ZONE_JST);
    // verify
    expect(resultUTC).toEqual(
      dayjs(date).tz(TIME_ZONE_UTC).subtract(1, 'month').startOf('month').toDate(),
    );
    expect(resultJST).toEqual(
      dayjs(date).tz(TIME_ZONE_JST).subtract(1, 'month').startOf('month').toDate(),
    );
  });

  it('getLastDayOfPreviousMonth', () => {
    const date = new Date('2024-01-01T12:00:00.000Z');
    // execute
    const resultUTC = getLastDayOfPreviousMonth(date, TIME_ZONE_UTC);
    const resultJST = getLastDayOfPreviousMonth(date, TIME_ZONE_JST);
    // verify
    expect(resultUTC).toEqual(
      dayjs(date).tz(TIME_ZONE_UTC).subtract(1, 'month').endOf('month').toDate(),
    );
    expect(resultJST).toEqual(
      dayjs(date).tz(TIME_ZONE_JST).subtract(1, 'month').endOf('month').toDate(),
    );
  });

  it('getFirstDayOfMonth', () => {
    const date = new Date('2024-01-01T12:00:00.000Z');
    // execute
    const resultUTC = getFirstDayOfMonth(date, TIME_ZONE_UTC);
    const resultJST = getFirstDayOfMonth(date, TIME_ZONE_JST);
    // verify
    expect(resultUTC).toEqual(dayjs(date).tz(TIME_ZONE_UTC).startOf('month').toDate());
    expect(resultJST).toEqual(dayjs(date).tz(TIME_ZONE_JST).startOf('month').toDate());
  });

  it('getLastDayOfMonth', () => {
    const date = new Date('2024-01-01T12:00:00.000Z');
    // execute
    const resultUTC = getLastDayOfMonth(date, TIME_ZONE_UTC);
    const resultJST = getLastDayOfMonth(date, TIME_ZONE_JST);
    // verify
    expect(resultUTC).toEqual(dayjs(date).tz(TIME_ZONE_UTC).endOf('month').toDate());
    expect(resultJST).toEqual(dayjs(date).tz(TIME_ZONE_JST).endOf('month').toDate());
  });

  it('getMinutes', () => {
    const date = new Date('2024-01-01T12:00:00.000Z');
    // execute
    const resultUTC = getMinutes(date, TIME_ZONE_UTC);
    const resultJST = getMinutes(date, TIME_ZONE_JST);
    // verify
    expect(resultUTC).toEqual(dayjs(date).tz(TIME_ZONE_UTC).minute());
    expect(resultJST).toEqual(dayjs(date).tz(TIME_ZONE_JST).minute());
  });

  it('getDates', () => {
    const date = new Date('2023-01-01T00:00:00.000Z');
    // execute
    const days = 10;
    const result = getDates(date, days);
    // verify
    expect(result).toHaveLength(days);
    expect(result[0]).toEqual(date);
    expect(result[days - 1]).toEqual(
      dayjs(date)
        .subtract(days - 1, 'day')
        .toDate(),
    );
  });

  it('getCronExpression', () => {
    const date = new Date('2024-01-01T12:00:00.000Z');
    const d = dayjs(date).tz(TIME_ZONE_UTC);
    // execute
    const result = getCronExpression(date);
    // verify
    expect(result).toEqual(
      `cron(${d.minute()} ${d.hour()} ${d.date()} ${d.month() + 1} ? ${d.year()})`,
    );
  });
});

describe('週関連の日付関数', () => {
  describe('getFirstDayOfWeek', () => {
    it('月曜日を週の開始日として返すこと（UTC）', () => {
      const date = new Date('2024-01-03T12:00:00.000Z'); // 水曜日
      const result = getFirstDayOfWeek(date, TIME_ZONE_UTC);
      const expected = dayjs(date).tz(TIME_ZONE_UTC).startOf('week').add(1, 'day').toDate();
      expect(result).toEqual(expected);
    });

    it('月曜日を週の開始日として返すこと（JST）', () => {
      const date = new Date('2024-01-03T12:00:00.000Z'); // 水曜日
      const result = getFirstDayOfWeek(date, TIME_ZONE_JST);
      const expected = dayjs(date).tz(TIME_ZONE_JST).startOf('week').add(1, 'day').toDate();
      expect(result).toEqual(expected);
    });
  });

  describe('getLastDayOfWeek', () => {
    it('日曜日を週の終了日として返すこと（UTC）', () => {
      const date = new Date('2024-01-03T12:00:00.000Z'); // 水曜日
      const result = getLastDayOfWeek(date, TIME_ZONE_UTC);
      const expected = dayjs(date).tz(TIME_ZONE_UTC).endOf('week').toDate();
      expect(result).toEqual(expected);
    });

    it('日曜日を週の終了日として返すこと（JST）', () => {
      const date = new Date('2024-01-03T12:00:00.000Z'); // 水曜日
      const result = getLastDayOfWeek(date, TIME_ZONE_JST);
      const expected = dayjs(date).tz(TIME_ZONE_JST).endOf('week').toDate();
      expect(result).toEqual(expected);
    });
  });

  describe('getFirstDayOfPreviousWeek', () => {
    it('前週の月曜日を返すこと（UTC）', () => {
      const date = new Date('2024-01-03T12:00:00.000Z'); // 水曜日
      const result = getFirstDayOfPreviousWeek(date, TIME_ZONE_UTC);
      const expected = dayjs(date)
        .tz(TIME_ZONE_UTC)
        .subtract(1, 'week')
        .startOf('week')
        .add(1, 'day')
        .toDate();
      expect(result).toEqual(expected);
    });

    it('前週の月曜日を返すこと（JST）', () => {
      const date = new Date('2024-01-03T12:00:00.000Z'); // 水曜日
      const result = getFirstDayOfPreviousWeek(date, TIME_ZONE_JST);
      const expected = dayjs(date)
        .tz(TIME_ZONE_JST)
        .subtract(1, 'week')
        .startOf('week')
        .add(1, 'day')
        .toDate();
      expect(result).toEqual(expected);
    });
  });

  describe('getLastDayOfPreviousWeek', () => {
    it('前週の日曜日を返すこと（UTC）', () => {
      const date = new Date('2024-01-03T12:00:00.000Z'); // 水曜日
      const result = getLastDayOfPreviousWeek(date, TIME_ZONE_UTC);
      const expected = dayjs(date).tz(TIME_ZONE_UTC).subtract(1, 'week').endOf('week').toDate();
      expect(result).toEqual(expected);
    });

    it('前週の日曜日を返すこと（JST）', () => {
      const date = new Date('2024-01-03T12:00:00.000Z'); // 水曜日
      const result = getLastDayOfPreviousWeek(date, TIME_ZONE_JST);
      const expected = dayjs(date).tz(TIME_ZONE_JST).subtract(1, 'week').endOf('week').toDate();
      expect(result).toEqual(expected);
    });
  });
});

describe('日付判定関数', () => {
  // テスト用の固定日時を設定
  const mockNow = new Date('2024-01-15T12:00:00.000Z'); // 2024年1月15日（月曜日）

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(mockNow);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('isToday', () => {
    it('今日の日付の場合trueを返すこと（JST）', () => {
      const today = new Date('2024-01-15T12:00:00.000Z'); // 同じ日付
      const result = isToday(today, TIME_ZONE_JST);
      expect(result).toBe(true);
    });

    it('昨日の日付の場合falseを返すこと（JST）', () => {
      const yesterday = new Date('2024-01-14T12:00:00.000Z'); // 前日
      const result = isToday(yesterday, TIME_ZONE_JST);
      expect(result).toBe(false);
    });

    it('明日の日付の場合falseを返すこと（JST）', () => {
      const tomorrow = new Date('2024-01-16T12:00:00.000Z'); // 翌日
      const result = isToday(tomorrow, TIME_ZONE_JST);
      expect(result).toBe(false);
    });
  });

  describe('isThisWeek', () => {
    it('今週の日付の場合trueを返すこと', () => {
      const thisWeekDate = new Date('2024-01-17T12:00:00.000Z'); // 水曜日
      const result = isThisWeek(thisWeekDate, TIME_ZONE_JST);
      expect(result).toBe(true);
    });

    it('先週の日付の場合falseを返すこと', () => {
      const lastWeekDate = new Date('2024-01-07T12:00:00.000Z'); // 先週の日曜日
      const result = isThisWeek(lastWeekDate, TIME_ZONE_JST);
      expect(result).toBe(false);
    });

    it('来週の日付の場合falseを返すこと', () => {
      const nextWeekDate = new Date('2024-01-22T12:00:00.000Z'); // 来週の月曜日
      const result = isThisWeek(nextWeekDate, TIME_ZONE_JST);
      expect(result).toBe(false);
    });
  });

  describe('isThisMonth', () => {
    it('今月の日付の場合trueを返すこと', () => {
      const thisMonthDate = new Date('2024-01-25T12:00:00.000Z');
      const result = isThisMonth(thisMonthDate, TIME_ZONE_JST);
      expect(result).toBe(true);
    });

    it('先月の日付の場合falseを返すこと', () => {
      const lastMonthDate = new Date('2023-12-31T12:00:00.000Z');
      const result = isThisMonth(lastMonthDate, TIME_ZONE_JST);
      expect(result).toBe(false);
    });

    it('来月の日付の場合falseを返すこと', () => {
      const nextMonthDate = new Date('2024-02-01T12:00:00.000Z');
      const result = isThisMonth(nextMonthDate, TIME_ZONE_JST);
      expect(result).toBe(false);
    });
  });
});

describe('相対日付表示関数', () => {
  const mockNow = new Date('2024-01-15T12:00:00.000Z');

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(mockNow);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getRelativeDateString', () => {
    it('今日の場合「今日」を返すこと', () => {
      const today = new Date('2024-01-15T10:00:00.000Z');
      const result = getRelativeDateString(today, TIME_ZONE_JST);
      expect(result).toBe('今日');
    });

    it('昨日の場合「昨日」を返すこと', () => {
      const yesterday = new Date('2024-01-14T10:00:00.000Z');
      const result = getRelativeDateString(yesterday, TIME_ZONE_JST);
      expect(result).toBe('昨日');
    });

    it('一昨日の場合「一昨日」を返すこと', () => {
      const dayBeforeYesterday = new Date('2024-01-13T10:00:00.000Z');
      const result = getRelativeDateString(dayBeforeYesterday, TIME_ZONE_JST);
      expect(result).toBe('一昨日');
    });

    it('3日前の場合「3日前」を返すこと', () => {
      const threeDaysAgo = new Date('2024-01-12T10:00:00.000Z');
      const result = getRelativeDateString(threeDaysAgo, TIME_ZONE_JST);
      expect(result).toBe('3日前');
    });

    it('1週間前の場合「7日前」を返すこと', () => {
      const oneWeekAgo = new Date('2024-01-08T10:00:00.000Z');
      const result = getRelativeDateString(oneWeekAgo, TIME_ZONE_JST);
      expect(result).toBe('7日前');
    });

    it('2週間前の場合「2週間前」を返すこと', () => {
      const twoWeeksAgo = new Date('2024-01-01T10:00:00.000Z');
      const result = getRelativeDateString(twoWeeksAgo, TIME_ZONE_JST);
      expect(result).toBe('2週間前');
    });

    it('2ヶ月前の場合「2ヶ月前」を返すこと', () => {
      const twoMonthsAgo = new Date('2023-11-15T10:00:00.000Z');
      const result = getRelativeDateString(twoMonthsAgo, TIME_ZONE_JST);
      expect(result).toBe('2ヶ月前');
    });

    it('2年前の場合「2年前」を返すこと', () => {
      const twoYearsAgo = new Date('2022-01-15T10:00:00.000Z');
      const result = getRelativeDateString(twoYearsAgo, TIME_ZONE_JST);
      expect(result).toBe('2年前');
    });
  });
});

describe('期間文字列関数', () => {
  describe('getDurationString', () => {
    it('同日の場合「当日」を返すこと', () => {
      const start = new Date('2024-01-15T09:00:00.000Z');
      const end = new Date('2024-01-15T17:00:00.000Z');
      const result = getDurationString(start, end, TIME_ZONE_JST);
      expect(result).toBe('当日');
    });

    it('1日間の場合「1日間」を返すこと', () => {
      const start = new Date('2024-01-15T09:00:00.000Z');
      const end = new Date('2024-01-16T09:00:00.000Z');
      const result = getDurationString(start, end, TIME_ZONE_JST);
      expect(result).toBe('1日間');
    });

    it('3日間の場合「3日間」を返すこと', () => {
      const start = new Date('2024-01-15T09:00:00.000Z');
      const end = new Date('2024-01-18T09:00:00.000Z');
      const result = getDurationString(start, end, TIME_ZONE_JST);
      expect(result).toBe('3日間');
    });

    it('1週間の場合「1週間」を返すこと', () => {
      const start = new Date('2024-01-15T09:00:00.000Z');
      const end = new Date('2024-01-22T09:00:00.000Z');
      const result = getDurationString(start, end, TIME_ZONE_JST);
      expect(result).toBe('1週間');
    });

    it('1週間と3日の場合「1週間3日」を返すこと', () => {
      const start = new Date('2024-01-15T09:00:00.000Z');
      const end = new Date('2024-01-25T09:00:00.000Z');
      const result = getDurationString(start, end, TIME_ZONE_JST);
      expect(result).toBe('1週間3日');
    });

    it('2ヶ月の場合「約2ヶ月」を返すこと', () => {
      const start = new Date('2024-01-15T09:00:00.000Z');
      const end = new Date('2024-03-15T09:00:00.000Z');
      const result = getDurationString(start, end, TIME_ZONE_JST);
      expect(result).toBe('約2ヶ月');
    });

    it('2年の場合「約2年」を返すこと', () => {
      const start = new Date('2022-01-15T09:00:00.000Z');
      const end = new Date('2024-01-15T09:00:00.000Z');
      const result = getDurationString(start, end, TIME_ZONE_JST);
      expect(result).toBe('約2年');
    });
  });
});
