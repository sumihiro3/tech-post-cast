import * as dayjs from 'dayjs';
import {
  TIME_ZONE_JST,
  TIME_ZONE_UTC,
  addMinutes,
  formatDate,
  getCronExpression,
  getDates,
  getFirstDayOfMonth,
  getFirstDayOfPreviousMonth,
  getLastDayOfMonth,
  getLastDayOfPreviousMonth,
  getMinutes,
  getStartOfDay,
  getStartOfDayFromString,
  getYesterday,
} from './date.util';

describe('first', () => {
  it('formatDate', () => {
    const date = new Date('2024-01-01T12:00:00.000Z');
    const formattedDateUTC = '20240101120000'
    const formattedDateJST = '20240101210000'
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
    const minutes = 30
    // execute
    const resultUTC = addMinutes(date, minutes, TIME_ZONE_UTC);
    const resultJST = addMinutes(date, minutes, TIME_ZONE_JST);
    // verify
    expect(resultUTC).toEqual(
      dayjs(date).tz(TIME_ZONE_UTC).add(minutes, 'minute').toDate(),
    );
    expect(resultJST).toEqual(
      dayjs(date).tz(TIME_ZONE_JST).add(minutes, 'minute').toDate(),
    );
  });

  it('getStartOfDayFromString', () => {
    const dateString = '20240101';
    // execute
    const resultUTC = getStartOfDayFromString(dateString, TIME_ZONE_UTC);
    const resultJST = getStartOfDayFromString(dateString, TIME_ZONE_JST);
    // verify
    expect(resultUTC).toEqual(
      dayjs(dateString).tz(TIME_ZONE_UTC).startOf('day').toDate(),
    );
    expect(resultJST).toEqual(
      dayjs(dateString).tz(TIME_ZONE_JST).startOf('day').toDate(),
    );
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
    const date = new Date('2024-01-01T12:00:00.000Z')
    const d = dayjs(date).tz(TIME_ZONE_UTC);
    // execute
    const result = getCronExpression(date);
    // verify
    expect(result).toEqual(
      `cron(${d.minute()} ${d.hour()} ${d.date()} ${d.month() + 1} ? ${d.year()})`,
    );
  });
});
