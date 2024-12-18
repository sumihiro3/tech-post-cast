import { ErrorBase, ErrorOptions } from '@tech-post-cast/commons';

/**
 * 番組ファイル生成処理エラーを表す基底クラス
 */
export class ProgramFileGenerationError extends ErrorBase {
  override name = 'ProgramFileGenerationError';
  constructor(message: string, options?: ErrorOptions) {
    super(message);
    this.cause = options?.cause;
  }
}

/**
 * 番組音声ファイル生成処理エラーを表すクラス
 */
export class ProgramAudioFileGenerationError extends ProgramFileGenerationError {
  override name = 'ProgramAudioFileGenerationError';
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

/**
 * 番組動画ファイル生成処理エラーを表すクラス
 */
export class ProgramVideoFileGenerationError extends ProgramFileGenerationError {
  override name = 'ProgramVideoFileGenerationError';
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}
