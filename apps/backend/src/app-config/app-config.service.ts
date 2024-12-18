import { AppConfigValidationError } from '@/types/errors';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService) {
    // 検証
    if (!this.DatabaseUrl) {
      throw new AppConfigValidationError('DATABASE_URL が設定されていません');
    }
    if (!this.QiitaAccessToken) {
      throw new AppConfigValidationError(
        'QIITA_API_ACCESS_TOKEN が設定されていません',
      );
    }
    if (!this.OpenAiApiKey) {
      throw new AppConfigValidationError('OPENAI_API_KEY が設定されていません');
    }
    if (!this.OpenAiSummarizationModel) {
      throw new AppConfigValidationError(
        'OPEN_AI_SUMMARIZATION_MODEL が設定されていません',
      );
    }
    if (!this.OpenAiScriptGenerationModel) {
      throw new AppConfigValidationError(
        'OPEN_AI_SCRIPT_GENERATION_MODEL が設定されていません',
      );
    }
    if (!this.ProgramFileGenerationTempDir) {
      throw new AppConfigValidationError(
        'PROGRAM_FILE_GENERATION_TEMP_DIR が設定されていません',
      );
    }
    if (!this.HeadlineTopicProgramTargetDir) {
      throw new AppConfigValidationError(
        'HEADLINE_TOPIC_PROGRAM_TARGET_DIR が設定されていません',
      );
    }
    if (!this.HeadlineTopicProgramBgmFilePath) {
      throw new AppConfigValidationError(
        'HEADLINE_TOPIC_PROGRAM_BGM_FILE_PATH が設定されていません',
      );
    }
    if (!this.HeadlineTopicProgramOpeningFilePath) {
      throw new AppConfigValidationError(
        'HEADLINE_TOPIC_PROGRAM_OPENING_FILE_PATH が設定されていません',
      );
    }
    if (!this.HeadlineTopicProgramEndingFilePath) {
      throw new AppConfigValidationError(
        'HEADLINE_TOPIC_PROGRAM_ENDING_FILE_PATH が設定されていません',
      );
    }
    if (!this.HeadlineTopicProgramPictureFilePath) {
      throw new AppConfigValidationError(
        'HEADLINE_TOPIC_PROGRAM_PICTURE_FILE_PATH が設定されていません',
      );
    }
    if (!this.ProgramAudioBucketName) {
      throw new AppConfigValidationError(
        'PROGRAM_AUDIO_BUCKET_NAME が設定されていません',
      );
    }
    if (!this.ProgramAudioFileUrlPrefix) {
      throw new AppConfigValidationError(
        'PROGRAM_AUDIO_FILE_URL_PREFIX が設定されていません',
      );
    }
  }

  /**
   * Database URL
   */
  get DatabaseUrl(): string {
    return this.config.get<string>('DATABASE_URL');
  }

  /**
   * SQL ログを出力するかどうか
   */
  get ShowQueryLogs(): boolean {
    return this.config.get<boolean>('SHOW_QUERY_LOGS');
  }

  /**
   * Qiita API のアクセストークン
   */
  get QiitaAccessToken(): string {
    return this.config.get<string>('QIITA_API_ACCESS_TOKEN');
  }

  /**
   * OpenAI API のアクセストークン
   */
  get OpenAiApiKey(): string {
    return this.config.get<string>('OPENAI_API_KEY');
  }

  /**
   * 記事の要約に使用する OpenAI モデル
   */
  get OpenAiSummarizationModel(): string {
    let v = this.config.get<string>('OPEN_AI_SUMMARIZATION_MODEL');
    if (!v) v = 'gpt-4o-mini';
    return v;
  }

  /**
   * 番組の台本生成に使用するOpenAIのモデル
   */
  get OpenAiScriptGenerationModel(): string {
    let v = this.config.get<string>('OPEN_AI_SCRIPT_GENERATION_MODEL');
    if (!v) v = 'gpt-4o-mini';
    return v;
  }

  /**
   * 番組ファイル生成で利用する一時ファイルの保存先
   */
  get ProgramFileGenerationTempDir(): string {
    return this.config.get<string>('PROGRAM_FILE_GENERATION_TEMP_DIR');
  }

  /**
   * 番組のターゲットディレクトリ
   */
  get HeadlineTopicProgramTargetDir(): string {
    return this.config.get<string>('HEADLINE_TOPIC_PROGRAM_TARGET_DIR');
  }

  /**
   * BGM ファイルのパス
   */
  get HeadlineTopicProgramBgmFilePath(): string {
    return this.config.get<string>('HEADLINE_TOPIC_PROGRAM_BGM_FILE_PATH');
  }

  /**
   * オープニングファイルのパス
   */
  get HeadlineTopicProgramOpeningFilePath(): string {
    return this.config.get<string>('HEADLINE_TOPIC_PROGRAM_OPENING_FILE_PATH');
  }

  /**
   * エンディングファイルのパス
   */
  get HeadlineTopicProgramEndingFilePath(): string {
    return this.config.get<string>('HEADLINE_TOPIC_PROGRAM_ENDING_FILE_PATH');
  }

  /**
   * 画像ファイルのパス
   */
  get HeadlineTopicProgramPictureFilePath(): string {
    return this.config.get<string>('HEADLINE_TOPIC_PROGRAM_PICTURE_FILE_PATH');
  }

  /**
   * オーディオバケット名
   */
  get ProgramAudioBucketName(): string {
    return this.config.get<string>('PROGRAM_AUDIO_BUCKET_NAME');
  }

  /**
   * オーディオファイルの URL プレフィックス
   */
  get ProgramAudioFileUrlPrefix(): string {
    return this.config.get<string>('PROGRAM_AUDIO_FILE_URL_PREFIX');
  }
}
