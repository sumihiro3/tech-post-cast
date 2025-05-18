import { Mastra } from '@mastra/core';

export * from './personalized-program';

/**
 * Mastra インスタンスかどうかを判定する
 * @param mastra Mastra インスタンス
 * @returns true: Mastra インスタンス, false: Mastra インスタンスではない
 */
export const isMastra = (mastra: any): mastra is Mastra => {
  return mastra && typeof mastra === 'object' && mastra instanceof Mastra;
};
