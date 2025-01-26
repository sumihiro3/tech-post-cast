import { ErrorBase, ErrorOptions } from '@tech-post-cast/commons';

/**
 * OpenAI API 実行エラーを表す基底クラス
 */
export class OpenAiApiError extends ErrorBase {
  override name = 'OpenAiApiError';
  constructor(message: string, options?: ErrorOptions) {
    super(message);
    this.cause = options?.cause;
  }
}

/**
 * 記事要約の実行エラーを表すクラス
 */
export class SummarizePostError extends OpenAiApiError {
  override name = 'SummarizePostError';
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

/**
 * 番組台本の生成エラーを表すクラス
 */
export class GenerateProgramScriptError extends OpenAiApiError {
  override name = 'GenerateProgramScriptError';
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

/**
 * 番組台本の検証エラーを表すクラス
 */
export class ProgramScriptValidationError extends OpenAiApiError {
  override name = 'ValidateProgramScriptError';
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}
