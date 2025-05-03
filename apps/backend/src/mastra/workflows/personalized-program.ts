import { Step } from '@mastra/core';
import { Workflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { isMastra } from '.';
import {
  getPersonalizedProgramScriptGenerationInstructions,
  personalizedProgramScriptGenerationAgent,
  qiitaPostSummarizeAndExtractKeyPointsAgent,
} from '../agents';
import {
  PersonalizedProgramScript,
  personalizedProgramScriptSchema,
  QiitaPost,
  qiitaPostSchema,
  QiitaPostWithSummaryAndKeyPoints,
  qiitaPostWithSummaryAndKeyPointsSchema,
  SummarizedQiitaPost,
} from '../schemas';

/** 番組台本生成ワークフローを動的に生成するステップ名 */
const CREATE_GENERATE_SCRIPT_WORKFLOW =
  'createPersonalizedProgramScriptGenerationWorkflow';

/** 番組生成ステップ名 */
const GENERATE_SCRIPT_STEP = 'generateScriptStep';

/** 記事要約ステップ名のプリフィックス */
const SUMMARIZE_POST_STEP_PREFIX = 'summarizePost_';

/**
 * パーソナルプログラム台本生成ワークフローを動的に生成するステップ
 */
export const createPersonalizedProgramScriptGenerationWorkflow = new Step({
  id: CREATE_GENERATE_SCRIPT_WORKFLOW,
  outputSchema: z.object({
    dynamicWorkflowResult: z.any(),
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
    const posts = context?.triggerData.posts as QiitaPost[];
    const userName = context?.triggerData.userName as string;
    logger.debug(`posts: ${JSON.stringify(posts)}`);
    logger.debug(`posts length: ${posts.length}`);
    logger.debug(`userName: ${userName}`);
    const workflow = new Workflow({
      name: 'dynamic Workflow',
      triggerSchema: z.object({
        posts: z.array(qiitaPostSchema).describe('記事のリスト'),
      }),
      mastra: mastra,
      result: {
        schema: personalizedProgramScriptSchema,
      },
    });
    logger.info(`番組台本生成ワークフローの生成を開始します`);
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
    workflow.step(createScriptStep(userName));
    // 動的ワークフローを構築してコミット
    workflow.commit();
    logger.info(
      `番組台本生成ワークフローの生成が完了したので、ワークフローを実行します。`,
    );
    // 実行を作成し、動的ワークフローを実行
    const run = workflow.createRun();
    const result = await run.start({
      triggerData: {
        posts,
      },
    });
    logger.debug(
      `番組台本生成ワークフロー実行結果: ${JSON.stringify(result.results)}`,
    );
    let dynamicWorkflowResult;
    if (result.results[GENERATE_SCRIPT_STEP]?.status === 'success') {
      dynamicWorkflowResult = result.results[GENERATE_SCRIPT_STEP]?.output;
    } else {
      logger.error(`番組台本生成ワークフローの実行に失敗しました`, {
        result,
      });
      throw new Error('番組台本生成ワークフローが失敗しました');
    }
    // 動的ワークフローからの結果を返す
    logger.info(`番組台本生成ワークフローの実行が完了しました`, {
      dynamicWorkflowResult,
    });
    return {
      dynamicWorkflowResult,
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
 * 番組の台本を生成するステップ
 * @param userName ユーザー名
 */
const createScriptStep = (userName: string) => {
  const scriptStep = new Step({
    id: GENERATE_SCRIPT_STEP,
    description: '番組の台本を生成するステップ',
    outputSchema: personalizedProgramScriptSchema,
    execute: async ({ context, mastra }) => {
      const logger = mastra.getLogger();
      logger.info(`記事の台本生成を開始します`);
      const posts = context?.triggerData.posts as QiitaPost[];
      // 各記事の要約を取得
      const summarizedPosts: SummarizedQiitaPost[] = [];
      const summaries: string[] = [];
      for (let i = 0; i < posts.length; i++) {
        const id = `${SUMMARIZE_POST_STEP_PREFIX}${i}`;
        // 記事要約ステップの結果を取得する
        const s = context?.getStepResult<SummarizedQiitaPost>(id);
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
      const agent = personalizedProgramScriptGenerationAgent;
      // 記事要約を元に台本生成用の Instructions を生成する
      const instructions = getPersonalizedProgramScriptGenerationInstructions(
        `Tech Post Cast`,
        summarizedPosts,
        new Date(),
        userName,
      );
      logger.debug(`${agent.name} Instructions: ${instructions}`);
      agent.__updateInstructions(instructions);
      const result = await agent.generate(
        `指定の Instructions に従ってラジオ番組の台本を生成してください。なお、出力構造は output で指定したスキーマに従って出力してください。`,
        {
          output: personalizedProgramScriptSchema,
        },
      );
      logger.info(`記事の台本生成が完了しました`, {
        result,
      });
      const script = result.object as PersonalizedProgramScript;
      return script;
    },
  });
  return scriptStep;
};
