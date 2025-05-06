import { PersonalizedProgramScript } from '@/mastra/schemas';
import { QiitaPostApiResponse } from '@tech-post-cast/commons';

/**
 * パーソナルプログラムの台本生成結果
 */
export type PersonalizedProgramScriptGenerationResult = {
  /** 番組台本 */
  script: PersonalizedProgramScript;
  /** 番組で紹介している Qiita 記事 */
  posts: QiitaPostApiResponse[];
};
