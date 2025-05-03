import { OtelConfig } from '@mastra/core';
import { createLogger } from '@mastra/core/logger';
import { Mastra } from '@mastra/core/mastra';
import { Workflow } from '@mastra/core/workflows';
import { LangfuseExporter } from 'langfuse-vercel';
import { z } from 'zod';
import { qiitaPostSummarizeAgent } from './agents';
import { personalizedProgramScriptSchema, qiitaPostSchema } from './schemas';
import { createPersonalizedProgramScriptGenerationWorkflow } from './workflows';

/**
 * LangFuse Exporter の設定
 */
const telemetry: OtelConfig = {
  serviceName: 'ai', // this must be set to "ai" so that the LangfuseExporter thinks it's an AI SDK trace
  enabled: true,
  export: {
    type: 'custom',
    exporter: new LangfuseExporter({
      publicKey: process.env.LANGFUSE_PUBLIC_KEY,
      secretKey: process.env.LANGFUSE_SECRET_KEY,
      baseUrl: process.env.LANGFUSE_BASEURL,
    }),
  },
};

/**
 * パーソナルプログラムの台本生成ワークフロー
 */
export const personalizedProgramWorkflow = new Workflow({
  name: 'personalizedProgramWorkflow',
  triggerSchema: z.object({
    userName: z.string().describe('ユーザー名'),
    posts: z.array(qiitaPostSchema).describe('記事のリスト'),
  }),
  mastra: new Mastra({
    telemetry,
  }),
  result: {
    schema: personalizedProgramScriptSchema,
  },
});
personalizedProgramWorkflow
  .step(createPersonalizedProgramScriptGenerationWorkflow)
  .commit();

/**
 * Main Mastra インスタンスのエクスポート
 */
export const mastra = new Mastra({
  workflows: { personalizedProgramWorkflow },
  agents: { qiitaPostSummarizeAgent },
  logger: createLogger({
    name: 'Mastra',
    level: 'info',
  }),
  telemetry,
});
