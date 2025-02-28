import { describe, expect, test } from "@jest/globals";
import { isFullWidthCharacter } from "./string.util";
describe("isFullWidthCharacter", () => {
  test("ASCIIキャラクタ（半角）の場合はfalseを返す", () => {
    // ASCIIキャラクタ（英語文字、数字、記号）
    expect(isFullWidthCharacter("A".charCodeAt(0))).toBe(false); // A: 0x41
    expect(isFullWidthCharacter("z".charCodeAt(0))).toBe(false); // z: 0x7A
    expect(isFullWidthCharacter("0".charCodeAt(0))).toBe(false); // 0: 0x30
    expect(isFullWidthCharacter("9".charCodeAt(0))).toBe(false); // 9: 0x39
    expect(isFullWidthCharacter("!".charCodeAt(0))).toBe(false); // !: 0x21
    expect(isFullWidthCharacter(" ".charCodeAt(0))).toBe(false); // スペース: 0x20
  });

  test("ASCIIの境界値の場合はfalseを返す", () => {
    // ASCIIの下限値
    expect(isFullWidthCharacter(0x0)).toBe(false); // NUL文字
    // ASCIIの上限値
    expect(isFullWidthCharacter(0x7f)).toBe(false); // DEL文字
  });

  test("ASCII以外の文字（全角）の場合はtrueを返す", () => {
    // 日本語文字
    expect(isFullWidthCharacter("あ".charCodeAt(0))).toBe(true); // ひらがな
    expect(isFullWidthCharacter("漢".charCodeAt(0))).toBe(true); // 漢字
    
    // 全角英数字
    expect(isFullWidthCharacter("Ａ".charCodeAt(0))).toBe(true); // 全角A
    expect(isFullWidthCharacter("９".charCodeAt(0))).toBe(true); // 全角9
    
    // ASCIIの上限値 + 1
    expect(isFullWidthCharacter(0x80)).toBe(true);
  });
  
  test("拡張Unicodeの範囲内の文字の場合はtrueを返す", () => {
    expect(isFullWidthCharacter(0x4e00)).toBe(true); // CJK統合漢字
    expect(isFullWidthCharacter(0x1f600)).toBe(true); // 絵文字: 笑顔
  });
});