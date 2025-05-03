import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';

/**
 * Qiita 記事の要約を生成するエージェント
 */
export const qiitaPostSummarizeAgent = new Agent({
  name: 'QiitaPostSummarizeAgent',
  instructions: `
    あなたはプロの編集者です。ユーザーから与えられたインプットを、要点を逃さない形で要約します。
    要約の読み手は日本のエンジニアです。エンジニアが読んで理解しやすい内容にすると喜ばれます。

    ## 制約
      - 要約は1000文字程度で出力します
      - 難しい漢字は読み手が間違えないように、ひらがなで書きます
      - 要約には markdown の記法やコード、改行コード、URL は含めないでください
  `,
  model: openai('gpt-4o-mini'),
});

/**
 * Qiita 記事の要約と要点を抽出するエージェント
 */
export const qiitaPostSummarizeAndExtractKeyPointsAgent = new Agent({
  name: 'QiitaPostSummarizeAndExtractKeyPointsAgent',
  instructions: `
    あなたはプロの編集者です。
    ユーザーから与えられたインプットである技術記事から、主にエンジニアが学べる観点で重要なポイントを箇条書きで抽出してください。
    文脈が理解しやすいように、できるだけ具体的に書いてください。
    要約および要点の読み手は日本のエンジニアです。エンジニアが読んで理解しやすい内容にすると喜ばれます。

    ## 制約
      - 記事の要約は1500文字から2000文字程度で出力します
      - 要約には markdown の記法やコード、改行コード、URL は含めないでください
  `,
  model: google('gemini-2.0-flash'),
});
