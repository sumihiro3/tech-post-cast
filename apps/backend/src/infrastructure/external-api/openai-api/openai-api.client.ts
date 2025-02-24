import { AppConfigService } from '@/app-config/app-config.service';
import {
  GenerateProgramScriptError,
  OpenAiApiError,
  ProgramScriptValidationError,
  SummarizePostError,
} from '@/types/errors';
import { IQiitaPostApiResponse } from '@domains/qiita-posts/qiita-posts.entity';
import {
  HeadlineTopicProgramScript,
  PostSummary,
  VectorizeResult,
} from '@domains/radio-program/headline-topic-program';
import { Injectable, Logger } from '@nestjs/common';
import {
  HeadlineTopicProgram,
  ListenerLetter,
  QiitaPost,
} from '@prisma/client';
import { getJapaneseDateStringWithWeekday } from '@tech-post-cast/commons';
import {
  HeadlineTopicProgramScriptSchema,
  parseHeadlineTopicProgramScript,
  PostSummarySchema,
} from '@tech-post-cast/database';
import * as fs from 'fs';
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';
@Injectable()
export class OpenAiApiClient {
  private readonly logger = new Logger(OpenAiApiClient.name);

  /**
   * OpenAI クライアント
   */
  private openAi: OpenAI;

  constructor(private readonly appConfig: AppConfigService) {}

  /**
   * OpenAI クライアントを取得する
   * @returns OpenAI クライアント
   */
  getOpenAiClient(): OpenAI {
    if (!this.openAi) {
      this.openAi = new OpenAI({
        apiKey: this.appConfig.OpenAiApiKey,
      });
    }
    return this.openAi;
  }

  /**
   * 記事を要約する
   * @param post 記事
   * @returns 記事要約
   */
  async summarizePost(
    post: IQiitaPostApiResponse | QiitaPost,
  ): Promise<PostSummary> {
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
        await this.getOpenAiClient().beta.chat.completions.parse(params);
      this.logger.debug(`記事を要約しました`, {
        chatCompletion: chatCompletion,
      });
      // 指定したスキーマで生成結果を取得する
      const summary = chatCompletion.choices[0]?.message.parsed as z.infer<
        typeof PostSummarySchema
      > as PostSummary;
      return summary;
    } catch (error) {
      const errorMessage = `記事の要約に失敗しました`;
      this.logger.error(errorMessage, { error });
      throw new SummarizePostError(errorMessage, {
        cause: error,
      });
    }
  }

  /**
   * 記事を要約するプロンプトを取得する
   * @param post 記事
   * @returns 記事要約のプロンプト
   */
  getPostSummarySystemPrompt(post: IQiitaPostApiResponse | QiitaPost): string {
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
   * @param letter リスナーからのお便り
   * @returns 台本
   */
  async generateHeadlineTopicProgramScript(
    programDate: Date,
    posts: IQiitaPostApiResponse[],
    letter?: ListenerLetter,
  ): Promise<HeadlineTopicProgramScript> {
    this.logger.verbose(
      `OpenAiApiClient.createDailyHeadlineTopicsScript called`,
      { programDate },
    );
    try {
      const prompt = this.getHeadlineTopicProgramScriptSystemPrompt(
        programDate,
        posts,
        letter,
      );
      this.logger.log(
        `ヘッドライントピック番組の台本作成用プロンプトを生成しました`,
        {
          prompt,
        },
      );
      const params: OpenAI.Chat.ChatCompletionCreateParams = {
        model: this.appConfig.OpenAiScriptGenerationModel,
        temperature: 0.8,
        // max_tokens: 4000,
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
        await this.getOpenAiClient().beta.chat.completions.parse(params);
      this.logger.debug(`ヘッドライントピック番組の台本を生成しました`, {
        chatCompletion: chatCompletion,
      });
      // 指定したスキーマで生成結果を取得する
      let script = chatCompletion.choices[0]?.message.parsed as z.infer<
        typeof HeadlineTopicProgramScriptSchema
      > as HeadlineTopicProgramScript;
      // 台本の検証を行う
      script = this.validateHeadlineTopicProgramScript(script, posts);
      return script;
    } catch (error) {
      const errorMessage = `ヘッドライントピック番組の台本生成に失敗しました`;
      this.logger.error(errorMessage, { error }, error.stack);
      if (error instanceof OpenAiApiError) {
        throw error;
      }
      // 独自エラークラスで返す
      throw new GenerateProgramScriptError(`台本の生成に失敗しました`, {
        cause: error,
      });
    }
  }

  /**
   * ヘッドライントピック番組の台本の検証を行う
   * @param script 台本
   * @param posts 記事一覧
   * @returns 検証後の台本
   */
  validateHeadlineTopicProgramScript(
    script: HeadlineTopicProgramScript,
    posts: IQiitaPostApiResponse[],
  ): HeadlineTopicProgramScript {
    this.logger.verbose(
      `OpenAiApiClient.validateHeadlineTopicProgramScript called`,
      { script, posts },
    );
    if (!script) {
      throw new ProgramScriptValidationError(`台本が存在しません`);
    }
    if (script.posts.length < posts.length) {
      throw new OpenAiApiError(
        `記事数よりも少ない記事の要約が生成されました [${script.posts.length} < ${posts.length}]`,
      );
    }
    // 生成された台本にある記事ID と対象記事のID が一致しているか検証する
    const postIds = posts.map((post) => post.id);
    script.posts.forEach((post) => {
      if (!postIds.includes(post.postId)) {
        this.logger.warn(`生成された台本に存在しない記事ID が含まれています`, {
          post,
        });
      }
    });
    // 記事の要約が複数含まれている場合があるため、対象記事の要約を一つずつ取得する
    const postSummaries: PostSummary[] = [];
    for (const p of posts) {
      // 対象記事の要約を取得する
      const filteredPostSummaries = this.getPostSummariesByPostId(
        p.id,
        script.posts,
      );
      if (filteredPostSummaries.length === 0) {
        throw new ProgramScriptValidationError(
          `生成された台本に記事ID [${p.id}] が含まれていません`,
        );
      }
      // 複数ある場合は要約文が長いものを残す
      if (filteredPostSummaries.length > 1) {
        this.logger.warn(`記事ID [${p.id}] は複数の記事要約が存在します`, {
          filteredPostSummaries,
        });
        const longestPostSummary = this.getLongestPostSummary(
          filteredPostSummaries,
        );
        // 要約文が無い場合はエラーを返す
        if (
          !longestPostSummary.summary ||
          longestPostSummary.summary.length === 0
        ) {
          throw new ProgramScriptValidationError(
            `記事ID [${p.id}] の要約文が空です`,
          );
        }
        postSummaries.push(longestPostSummary);
      } else {
        postSummaries.push(filteredPostSummaries[0]);
      }
    }
    script.posts = postSummaries;
    return script;
  }

  /**
   * 指定した記事IDの記事要約を取得する
   * 複数ある場合はすべて取得する
   * @param postId 記事ID
   * @param posts 記事一覧
   * @returns 記事要約
   */
  getPostSummariesByPostId(
    postId: string,
    posts: PostSummary[],
  ): PostSummary[] {
    this.logger.verbose(`OpenAiApiClient.getPostSummariesByPostId called`, {
      postId,
      posts,
    });
    const postSummaries = posts.filter((post) => post.postId === postId);
    return postSummaries;
  }

  /**
   * 指定の記事要約のうち、要約文が最も長いものを取得する
   * @param postSummaries 記事要約
   * @returns 要約文が最も長い記事要約
   */
  getLongestPostSummary(postSummaries: PostSummary[]): PostSummary {
    this.logger.verbose(`OpenAiApiClient.getLongestPostSummary called`, {
      postSummaries,
    });
    let longestPostSummary = postSummaries[0];
    for (let i = 1; i < postSummaries.length; i++) {
      if (longestPostSummary.summary.length < postSummaries[i].summary.length) {
        longestPostSummary = postSummaries[i];
      }
    }
    return longestPostSummary;
  }

  /**
   *「今日のヘッドライントピックス」の台本生成用システムプロンプトを取得する
   * @param programDate 番組日
   * @param posts 記事一覧
   * @param letter リスナーからのお便り
   * @returns 台本生成用プロンプト
   */
  getHeadlineTopicProgramScriptSystemPrompt(
    programDate: Date,
    posts: IQiitaPostApiResponse[],
    letter?: ListenerLetter,
  ): string {
    this.logger.verbose(
      { posts: posts },
      `OpenAiApiClient.getHeadlineTopicProgramScriptSystemPrompt called`,
    );
    const programName = 'Tech Post Cast';
    const date = getJapaneseDateStringWithWeekday(programDate);
    let letterText = '（なし）';
    if (letter) {
      letterText = `
#### ペンネーム

${letter.penName}

#### お便りの内容

${letter.body}
`;
    }
    // 台本生成のシステムプロンプトを組み立てる
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
    - 冒頭は「こんにちは、Tech Post Cast のポステルです。」のように言います
- 挨拶では、今日の日付（月、日、曜日）を添えて、今日の日付に応じた雑談を30秒程度します
    - 「如月」や「師走」などの和風月名は使わないでください
- 「リスナーからのお便り」がある場合は、必ずお便りの内容を読み上げます（厳守してください）
    - 「リスナーからのお便り」は、「ペンネーム」、「お便りの内容」の順番に正確に読み上げます
    - 読み上げた後に、ポステルとして感想にリアクションしたり質問に答えたりします
- そして、Qiita（キータ） で今日のヘッドライントピックとしてトレンドの記事を紹介することを伝えます
- 今日紹介する記事の本数（${posts.length} 本）を伝えます

### 紹介記事の要約

- ${posts.length} 本の「紹介する記事」を紹介します
- 必ず ${posts.length} 本すべての記事を紹介します（厳守してください）
- 'posts' に含まれる記事のみ紹介してください（それ以外の記事は紹介しないでください）
    - ただし、同じ記事を2回以上紹介しないでください
- 紹介記事の冒頭は「最初の記事は 『{記事のタイトル}』 です。」のように始めてください
- 何番目の記事であるか、最後の記事であるかが分かるようにしてください
- 必ず記事のタイトルを伝えます
- 1つの記事につき500文字程度で話します
    - 最大でも600文字以内に収めてください

### エンディング

- 最後に締めの挨拶です
- 今日紹介した記事を簡単におさらいします
    - 必ず ${posts.length} 本の記事を振り返ります
    - それぞれの記事のタイトルと、要約を簡潔に振り返ります
- 番組で紹介した記事へのリンクは「紹介記事欄」にあることを伝えます
- 番組への感想を募集していることを伝えます
- 最後に「ポステルでした。次の番組でお会いしましょう。」と締めくくります

## 台本生成の制約

- 台本部分はセリフ部分だけを出力します
- 台本の冒頭に「ポステル：」という表記は入れないでください
- 「Qiita」は「キータ」と読みます
    - 文中に「Qiita」「qiita」が出てきた場合は「キータ」と読みます
- 難しい漢字は読み手が間違えないように、ひらがなで書きます
- 読み上げ用の原稿なので、URL や Markdown の記法、改行コード（\n など）、バックスラッシュやクオート文字を含めないは含めないでください
- 出力のうち 'posts' 部分は、指定した'PostSummarySchema' の構造に準拠してください
    - 'posts' 部分に出力するのは紹介記事の要約のみです
    - 'postId' は記事のID、'title' は記事のタイトル、'summary' は記事の要約を出力してください
- 出力する文字数の下限は3000文字（この文字数は遵守してください）
- 出力する文字数の上限は4000文字（この文字数は遵守してください）

### 今日の日付

${date}

### リスナーからのお便り

${letterText}

### 紹介する記事

`;
    // 今日紹介する記事を組み立てる
    const postsScript = posts.map((post, index) => {
      return `#### ${index + 1}つ目の記事

##### 記事ID

${post.id}

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
    const response = await this.getOpenAiClient().audio.speech.create({
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
      return `${post.summary}`;
    });
    const postSummariesText = postSummaries.join('\n');
    // 台本を組み立てる
    const scriptText = `${script.intro}
    ${postSummariesText}
    ${script.ending}`;
    return scriptText;
  }

  /**
   * ヘッドライントピック番組の台本をベクトル化する
   * @param program 番組
   * @returns 台本のベクトル
   */
  async vectorizeHeadlineTopicProgramScript(
    program: HeadlineTopicProgram,
  ): Promise<VectorizeResult> {
    this.logger.debug(
      `OpenAiApiClient.vectorizeHeadlineTopicProgramScript called`,
      {
        id: program.id,
        title: program.title,
      },
    );
    const script = parseHeadlineTopicProgramScript(
      program.script,
    ) as HeadlineTopicProgramScript;
    // 台本をベクトル化
    const response = await this.getOpenAiClient().embeddings.create({
      model: 'text-embedding-3-small',
      input: this.getHeadlineTopicProgramScriptText(script),
      encoding_format: 'float',
    });
    const vector = response.data[0].embedding;
    if (!vector) {
      const errorMessage = `ベクトルが取得できませんでした`;
      this.logger.error(errorMessage, {
        id: program.id,
        title: program.title,
        response,
      });
      throw new OpenAiApiError(`ベクトルが取得できませんでした`);
    }
    this.logger.debug(`ヘッドライントピック番組の台本をベクトル化しました`, {
      object: response.object,
      totalToken: response.usage.total_tokens,
    });
    const result: VectorizeResult = {
      vector,
      totalTokens: response.usage.total_tokens,
      model: response.model,
    };
    return result;
  }
}
