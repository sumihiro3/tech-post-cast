import { Step } from '@mastra/core';
import { Workflow } from '@mastra/core/workflows';
import { SpeakerMode } from '@prisma/client';
import { z } from 'zod';
import { isMastra } from '.';
import {
  getHeadlineTopicProgramScriptGenerationInstructions,
  headlineTopicProgramScriptGenerationAgent,
  qiitaPostSummarizeAndExtractKeyPointsAgent,
} from '../agents';
import {
  headlineTopicProgramScriptSchema,
  QiitaPost,
  qiitaPostSchema,
  QiitaPostWithSummaryAndKeyPoints,
  qiitaPostWithSummaryAndKeyPointsSchema,
} from '../schemas';

/** ヘッドライントピック番組台本生成ワークフローを動的に生成するステップ名 */
export const CREATE_HEADLINE_TOPIC_PROGRAM_SCRIPT_WORKFLOW =
  'createHeadlineTopicProgramScriptGenerationWorkflow';

/** ヘッドライントピック番組台本生成ワークフロー名 */
const HEADLINE_TOPIC_PROGRAM_SCRIPT_GENERATION_WORKFLOW =
  'HeadlineTopicProgramScriptGenerationWorkflow';

/** ヘッドライントピック番組台本生成ステップ名 */
const GENERATE_HEADLINE_SCRIPT_STEP = 'generateHeadlineScriptStep';

/** 記事要約ステップ名のプリフィックス */
const SUMMARIZE_POST_STEP_PREFIX = 'summarizePost_';

/**
 * ヘッドライントピック番組台本生成ワークフローを動的に生成するステップ
 */
export const createHeadlineTopicProgramScriptGenerationWorkflow = new Step({
  id: CREATE_HEADLINE_TOPIC_PROGRAM_SCRIPT_WORKFLOW,
  outputSchema: z.object({
    scriptGenerationWorkflowResult: z.any(),
  }),
  execute: async ({ context, mastra }) => {
    const logger = mastra.getLogger();
    if (!mastra) {
      const errorMessage = `Mastraインスタンスが利用できません`;
      logger.error(errorMessage, { mastra });
      throw new Error(errorMessage);
    }
    if (!isMastra(mastra)) {
      const errorMessage = `Mastraインスタンスが不正な状態です`;
      logger.error(errorMessage, { mastra });
      throw new Error(errorMessage);
    }

    const programName = context?.triggerData.programName as string;
    const programDate = context?.triggerData.programDate as Date;
    const posts = context?.triggerData.posts as QiitaPost[];
    const listenerLetters = context?.triggerData.listenerLetters as Array<{
      id: string;
      penName: string;
      body: string;
    }>;
    const speakerMode =
      (context?.triggerData.speakerMode as SpeakerMode) || SpeakerMode.SINGLE;

    logger.debug(
      JSON.stringify({
        posts: posts.map((post) => ({
          id: post.id,
          title: post.title,
        })),
        postsLength: posts.length,
        listenerLettersLength: listenerLetters?.length || 0,
        programName,
        programDate,
        speakerMode,
      }),
    );

    const resultSchema = headlineTopicProgramScriptSchema;

    const workflow = new Workflow({
      name: HEADLINE_TOPIC_PROGRAM_SCRIPT_GENERATION_WORKFLOW,
      triggerSchema: z.object({
        posts: z.array(qiitaPostSchema).describe('記事のリスト'),
        listenerLetters: z
          .array(
            z.object({
              id: z.string(),
              penName: z.string(),
              body: z.string(),
            }),
          )
          .optional()
          .describe('リスナーからのお便り'),
      }),
      mastra: mastra,
      result: {
        schema: resultSchema,
      },
    });

    logger.info(
      `ヘッドライントピック番組台本生成ワークフローの生成を開始します`,
    );
    const summarizeSteps = [];

    // 各記事の要約を生成するステップを定義する
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      logger.info(`記事の要約を生成するステップを定義します: ${post.id}`);
      const step = createSummarizeStep(i, post);
      summarizeSteps.push(step);
      workflow.step(step);
    }

    // 各記事の要約が終了するのを待つ
    workflow.after(summarizeSteps);

    // 要約が終わったら、台本生成のステップを定義
    workflow.step(
      createHeadlineScriptStep(
        programName,
        programDate,
        listenerLetters,
        speakerMode,
      ),
    );

    // 動的ワークフローを構築してコミット
    workflow.commit();
    logger.info(
      `ヘッドライントピック番組台本生成ワークフローの生成が完了したので、ワークフローを実行します。`,
    );

    // 実行を作成し、動的ワークフローを実行
    const run = workflow.createRun();
    const result = await run.start({
      triggerData: {
        posts,
        listenerLetters,
      },
    });

    logger.debug(
      `ヘッドライントピック番組台本生成ワークフロー実行結果: ${JSON.stringify(result.results)}`,
    );

    let scriptGenerationWorkflowResult;
    if (result.results[GENERATE_HEADLINE_SCRIPT_STEP]?.status === 'success') {
      scriptGenerationWorkflowResult =
        result.results[GENERATE_HEADLINE_SCRIPT_STEP]?.output;
    } else {
      logger.error(
        `ヘッドライントピック番組台本生成ワークフローの実行に失敗しました`,
        {
          result,
        },
      );
      throw new Error(
        'ヘッドライントピック番組台本生成ワークフローが失敗しました',
      );
    }

    // 動的ワークフローからの結果を返す
    logger.info(
      `ヘッドライントピック番組台本生成ワークフローの実行が完了しました`,
      {
        result: scriptGenerationWorkflowResult,
      },
    );
    return {
      scriptGenerationWorkflowResult,
    };
  },
});

/**
 * 記事要約のステップを作成
 */
const createSummarizeStep = (index: number, post: QiitaPost) => {
  const step = new Step({
    id: `${SUMMARIZE_POST_STEP_PREFIX}${index}`,
    description: `Qiita 記事の要約を生成するステップ: ${index}`,
    inputSchema: qiitaPostSchema,
    outputSchema: qiitaPostWithSummaryAndKeyPointsSchema,
    payload: post,
    execute: async ({ context, mastra }) => {
      const logger = mastra.getLogger();
      logger.debug(`context: ${JSON.stringify(context)}`);
      const post = context?.inputData as QiitaPost;
      logger.debug(`post: ${JSON.stringify(post)}`);
      const postId = post.id;
      logger.info(`記事の要約を開始します ID: ${postId}`);
      const result = await qiitaPostSummarizeAndExtractKeyPointsAgent.generate(
        `以下の記事を要約してください。なお、出力構造は output で指定したスキーマに従って出力してください。
          ----\n
          ${post.content}
          \n----`,
        {
          output: qiitaPostWithSummaryAndKeyPointsSchema,
        },
      );
      logger.info(`記事の要約が完了しました`, { result });
      const summarizeResult = result.object as QiitaPostWithSummaryAndKeyPoints;
      return {
        id: postId,
        title: post.title,
        summary: summarizeResult.summary,
        keyPoints: summarizeResult.keyPoints,
        author: post.author,
        tags: post.tags,
        createdAt: post.createdAt,
      };
    },
  });
  return step;
};

/**
 * ヘッドライントピック番組の台本を生成するステップ
 * @param programName 番組名
 * @param programDate 番組日
 * @param listenerLetters リスナーからのお便り
 * @param speakerMode 話者モード
 */
const createHeadlineScriptStep = (
  programName: string,
  programDate: Date,
  listenerLetters?: Array<{
    id: string;
    penName: string;
    body: string;
  }>,
  speakerMode: SpeakerMode = SpeakerMode.SINGLE,
) => {
  const outputSchema = headlineTopicProgramScriptSchema;

  const scriptStep = new Step({
    id: GENERATE_HEADLINE_SCRIPT_STEP,
    description: 'ヘッドライントピック番組の台本を生成するステップ',
    outputSchema,
    execute: async ({ context, mastra }) => {
      const logger = mastra.getLogger();
      logger.info(`ヘッドライントピック番組の台本生成を開始します`);
      const posts = context?.triggerData.posts as QiitaPost[];

      // 各記事の要約を取得
      const summarizedPosts: QiitaPostWithSummaryAndKeyPoints[] = [];
      const summaries: string[] = [];
      for (let i = 0; i < posts.length; i++) {
        const id = `${SUMMARIZE_POST_STEP_PREFIX}${i}`;
        // 記事要約ステップの結果を取得する
        const s = context?.getStepResult<QiitaPostWithSummaryAndKeyPoints>(id);
        logger.debug(`Summarized qiita posts: ${JSON.stringify(s)}`);
        if (s) {
          summarizedPosts.push(s);
          summaries.push(s?.summary);
        }
      }

      if (!summarizedPosts || summarizedPosts.length !== posts.length) {
        const errorMessage = `要約された記事の数が不足しています [expected: ${posts.length}, actual: ${summarizedPosts.length}]`;
        logger.error(errorMessage, { summarizedPosts });
        throw new Error(errorMessage);
      }

      // 台本生成用のエージェントを作成する
      const agent = headlineTopicProgramScriptGenerationAgent;

      // 記事要約を元に台本生成用の Instructions を生成する
      const instructions = getHeadlineTopicProgramScriptGenerationInstructions(
        programName,
        summarizedPosts,
        programDate,
        listenerLetters,
        speakerMode,
      );

      logger.debug(`${agent.name} Instructions: ${instructions}`);
      agent.__updateInstructions(instructions);

      const result = await agent.generate(
        `指定の Instructions に従ってラジオ番組の台本を生成してください。なお、出力構造は output で指定したスキーマに従って出力してください。`,
        {
          output: headlineTopicProgramScriptSchema,
        },
      );

      logger.info(`ヘッドライントピック番組の台本生成が完了しました`, {
        result,
      });

      // personalizedProgramScriptSchemaと同じ構造の台本を取得
      const script = result.object;

      logger.debug(`ヘッドライントピック番組台本生成完了`, { script });
      return script;
    },
  });
  return scriptStep;
};
