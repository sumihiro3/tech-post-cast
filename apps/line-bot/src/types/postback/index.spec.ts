import { describe, expect, test } from '@jest/globals';
import { fail } from 'assert';
import { PostbackData } from '.';

describe('PostbackData', () => {
  test('Postback データをパースしてプロパティへ設定する', () => {
    const data = 'type=headlineTopicProgram&id=xxxx';
    const postbackData = new PostbackData(data);
    expect(postbackData.type).toBe('headlineTopicProgram');
    expect(postbackData.id).toBe('xxxx');
  });
  test('異常系：プロパティが不足している場合はエラーとなる', () => {
    const data = 'type=headlineTopicProgram';
    try {
      new PostbackData(data);
      fail('例外が発生しませんでした');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  });
});
