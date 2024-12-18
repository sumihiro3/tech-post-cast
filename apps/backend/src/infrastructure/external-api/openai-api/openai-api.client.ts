import { AppConfigService } from '@/app-config/app-config.service';
import { IQiitaPostApiResponse } from '@domains/qiita-posts/qiita-posts.entity';
import {
  HeadlineTopicProgramScript,
  PostSummary,
} from '@domains/radio-program/headline-topic-program';
import { Injectable, Logger } from '@nestjs/common';
import { getJapaneseDateStringWithWeekday } from '@tech-post-cast/commons';
import * as fs from 'fs';
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import { HeadlineTopicProgramScriptSchema, PostSummarySchema } from './schemas';

@Injectable()
export class OpenAiApiClient {
  private readonly logger = new Logger(OpenAiApiClient.name);

  /**
   * OpenAI クライアント
   */
  private openAi: OpenAI;

  constructor(private readonly appConfig: AppConfigService) {
    this.openAi = new OpenAI({
      apiKey: this.appConfig.OpenAiApiKey,
    });
  }

  /**
   * 記事を要約する
   * @param post 記事
   * @returns 記事要約
   */
  async summarizePost(post: IQiitaPostApiResponse): Promise<PostSummary> {
    this.logger.debug(`OpenAiApiClient.summarizePost called`, { post });
    try {
      const systemPrompt = this.getPostSummarySystemPrompt(post);
      const params: OpenAI.Chat.ChatCompletionCreateParams = {
        model: this.appConfig.OpenAiSummarizationModel,
        temperature: 0.8,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: post.body,
          },
        ],
        // 生成結果のスキーマを指定する
        response_format: zodResponseFormat(PostSummarySchema, 'summary'),
      };
      const chatCompletion =
        await this.openAi.beta.chat.completions.parse(params);
      // await this.openAi.chat.completions.create(params);
      this.logger.debug(`記事を要約しました`, {
        chatCompletion: chatCompletion,
      });
      // 指定したスキーマで生成結果を取得する
      const summary = chatCompletion.choices[0]?.message.parsed as z.infer<
        typeof PostSummarySchema
      > as PostSummary;
      return summary;
    } catch (error) {
      this.logger.error(`記事の要約に失敗しました`, { error });
      // TODO エラークラスを作成して返す
      throw error;
    }
  }

  /**
   * 記事を要約するプロンプトを取得する
   * @param post 記事
   * @returns 記事要約のプロンプト
   */
  getPostSummarySystemPrompt(post: IQiitaPostApiResponse): string {
    this.logger.verbose(
      { post: post },
      `OpenAiApiClient.getPostSummarySystemPrompt called`,
    );
    return `
    ## Instruction

あなたはプロの編集者です。ユーザーから与えられたインプットを、要点を逃さない形で要約します。
要約の読み手は日本のエンジニアです。エンジニアが読んで理解しやすい内容にすると喜ばれます。

## 制約

- 要約は800文字程度で出力します
- 難しい漢字は読み手が間違えないように、ひらがなで書きます
- 要約には markdown の記法やコード、改行コード、URL は含めないでください
`;
  }

  /**
   * ヘッドライントピック番組の台本を生成する
   * @param programDate 番組日
   * @param posts 記事一覧
   * @returns 台本
   */
  async generateHeadlineTopicProgramScript(
    programDate: Date,
    posts: IQiitaPostApiResponse[],
  ): Promise<HeadlineTopicProgramScript> {
    this.logger.verbose(
      `OpenAiApiClient.createDailyHeadlineTopicsScript called`,
      { programDate },
    );
    try {
      const prompt = this.getHeadlineTopicProgramScriptSystemPrompt(
        programDate,
        posts,
      );
      const params: OpenAI.Chat.ChatCompletionCreateParams = {
        model: this.appConfig.OpenAiScriptGenerationModel,
        temperature: 0.8,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        // 生成結果のスキーマを指定する
        response_format: zodResponseFormat(
          HeadlineTopicProgramScriptSchema,
          'script',
        ),
      };
      const chatCompletion =
        await this.openAi.beta.chat.completions.parse(params);
      this.logger.debug(`ヘッドライントピック番組の台本を生成しました`, {
        chatCompletion: chatCompletion,
      });
      // 指定したスキーマで生成結果を取得する
      const script = chatCompletion.choices[0]?.message.parsed as z.infer<
        typeof HeadlineTopicProgramScriptSchema
      > as HeadlineTopicProgramScript;
      return script;
    } catch (error) {
      this.logger.error(
        `ヘッドライントピック番組の台本生成に失敗しました`,
        {
          error,
        },
        error.stack,
      );
      // TODO 独自エラークラスを作成して返す
      throw error;
    }
  }

  /**
   *「今日のヘッドライントピックス」の台本生成用システムプロンプトを取得する
   * @param programDate 番組日
   * @param posts 記事一覧
   * @returns 台本生成用プロンプト
   */
  getHeadlineTopicProgramScriptSystemPrompt(
    programDate: Date,
    posts: IQiitaPostApiResponse[],
  ): string {
    this.logger.verbose(
      { posts: posts },
      `OpenAiApiClient.getHeadlineTopicProgramScriptSystemPrompt called`,
    );
    const programName = 'Tech Post Cast';
    const date = getJapaneseDateStringWithWeekday(programDate);
    const instruction = `
## Instruction

あなたはプロの放送作家です。
与えられる情報をもとに、ラジオでMCが読み上げる台本を作成します。

- ラジオは楽しい雰囲気で、スピーカーは日本のFMラジオのような喋り方をします
- ラジオのMCは1人で、名前は「ポステル（Postel）」です
- ポステルは知的で物静かな人物で、エンジニアをリスペクトしています
- 口調は優しく丁寧です
- 番組名は「${programName}」です

## 番組の構成

### 番組タイトル

- 番組タイトルは、必ず紹介する記事タイトルを2つ使って25文字以内で考えてください
- 最後に「など」をつけてください

### イントロダクション

- 最初に番組名とポステルの名前を含めて挨拶をします
- 挨拶では、今日の日付（月、日、曜日）を添えて、今日の日付に応じた雑談を30秒程度します
    - 「如月」や「師走」などの和風月名は使わないでください
- そして、Qiita（キータ） で今日のヘッドライントピックとしてトレンドの記事を紹介することを伝えます
- 今日紹介する記事の本数（${posts.length} 本）を伝えます

### 紹介記事の要約

- ${posts.length} 本の「紹介する記事」を紹介します
- 必ず ${posts.length} 本すべての記事を紹介します（厳守してください）
- 必ず記事のタイトルを伝えます
- 1つの記事につき500文字程度で話します
    - 最大でも550文字以内に収めてください
- 複数の記事を紹介するので、記事の境目に一拍置くなど分かりやすくします

### エンディング

- 最後に締めの挨拶です
- 今日紹介した記事を簡単におさらいします
    - 必ず ${posts.length} 本の記事を振り返ります
- 詳しい内容は「紹介記事欄」に書いてあることを伝えます
- 番組への感想を募集していることを伝えます
- 次回も番組を視聴してくれるよう、会えるのを楽しみにしていることを伝えます
- 最後に「ポステルでした。また次回お会いしましょう」と締めくくります

## 台本生成の制約

- 台本部分はセリフ部分だけを出力します
- 台本の冒頭に「ポステル：」という表記は入れないでください
- 「Qiita」は「キータ」と読みます
    - 文中に「Qiita」「qiita」が出てきた場合は「キータ」と読みます
- 難しい漢字は読み手が間違えないように、ひらがなで書きます
- 読み上げ用の原稿なので、URL や Markdown の記法、改行コード（\n など）は含めないでください
- 出力する文字数の下限は3000文字（この文字数は遵守してください）
- 出力する文字数の上限は4000文字（この文字数は遵守してください）

### 今日の日付

${date}

### 紹介する記事

`;
    // 今日紹介する記事を組み立てる
    const postsScript = posts.map((post, index) => {
      return `#### ${index + 1}つ目の記事

##### タイトル

${post.title}

##### 記事の要約

${post.summary}
`;
    });
    const postsScriptText = postsScript.join('\n\n');
    return `${instruction}\n\n${postsScriptText}`;
  }

  /**
   * ヘッドライントピック番組の音声ファイルを生成する
   * @param audioFilePath 生成した音声ファイルの保存先
   * @param script 台本
   */
  async generateHeadlineTopicProgramAudioFile(
    audioFilePath: string,
    script: HeadlineTopicProgramScript,
  ): Promise<void> {
    this.logger.debug(
      `OpenAiApiClient.generateHeadlineTopicProgramAudioFile called`,
    );
    // 音声ファイルを生成
    const response = await this.openAi.audio.speech.create({
      model: 'tts-1-hd',
      voice: 'nova',
      input: this.getHeadlineTopicProgramScriptText(script),
    });
    // 音声ファイルを保存
    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.promises.writeFile(audioFilePath, buffer);
    this.logger.log(`ヘッドライントピック番組の音声ファイルを生成しました`, {
      path: audioFilePath,
    });
  }

  /**
   * ヘッドライントピック番組の台本文字列を取得する
   * @param script 台本
   * @returns 台本文字列
   */
  getHeadlineTopicProgramScriptText(
    script: HeadlineTopicProgramScript,
  ): string {
    this.logger.debug(
      `OpenAiApiClient.getHeadlineTopicProgramScriptText called`,
    );
    const postSummaries = script.posts.map((post) => {
      return `${post.summary} 。。。。`;
    });
    const postSummariesText = postSummaries.join('\n');
    // 台本を組み立てる
    const scriptText = `${script.intro}。。。。
    ${postSummariesText}。。。。
    ${script.ending}`;
    return scriptText;
  }
}
