import { ErrorBase, ErrorOptions } from '@tech-post-cast/commons';

/**
 * Text to Speech 処理エラーを表す基底クラス
 */
export class TextToSpeechError extends ErrorBase {
  override name = 'TextToSpeechError';
  constructor(message: string, options?: ErrorOptions) {
    super(message);
    this.cause = options?.cause;
  }
}
