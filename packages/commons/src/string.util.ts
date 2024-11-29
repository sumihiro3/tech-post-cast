
/**
 * 指定の文字が全角文字か半角文字かを判定する
 * @param c 文字
 * @returns 全角文字の場合 true、半角文字の場合 false
 */
export const isFullWidthCharacter = (c: number): boolean => {
  return c >= 0x0 && c <= 0x7f ? false : true;
};
