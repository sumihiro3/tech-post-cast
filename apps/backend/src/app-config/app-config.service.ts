import { AppConfigValidationError } from '@/types/errors';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  private readonly logger = new Logger(AppConfigService.name);

  constructor(private readonly config: ConfigService) {
    // 検証
    if (!this.V1ApiToken) {
      throw new AppConfigValidationError(
        'V1_API_ACCESS_TOKEN が設定されていません',
      );
    }
    if (!this.BackendApiToken) {
      throw new AppConfigValidationError(
        'BACKEND_API_ACCESS_TOKEN が設定されていません',
      );
    }
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
    if (!this.HeadlineTopicProgramSeShortFilePath) {
      throw new AppConfigValidationError(
        'HEADLINE_TOPIC_PROGRAM_SE_SHORT_FILE_PATH が設定されていません',
      );
    }
    if (!this.HeadlineTopicProgramSeLongFilePath) {
      throw new AppConfigValidationError(
        'HEADLINE_TOPIC_PROGRAM_SE_LONG_FILE_PATH が設定されていません',
      );
    }
    if (!this.HeadlineTopicProgramPictureFilePath) {
      throw new AppConfigValidationError(
        'HEADLINE_TOPIC_PROGRAM_PICTURE_FILE_PATH が設定されていません',
      );
    }
    if (!this.PersonalizedProgramTargetDir) {
      throw new AppConfigValidationError(
        'PERSONALIZED_PROGRAM_TARGET_DIR が設定されていません',
      );
    }
    if (!this.PersonalizedProgramBgmFilePath) {
      throw new AppConfigValidationError(
        'PERSONALIZED_PROGRAM_BGM_FILE_PATH が設定されていません',
      );
    }
    if (!this.PersonalizedProgramOpeningFilePath) {
      throw new AppConfigValidationError(
        'PERSONALIZED_PROGRAM_OPENING_FILE_PATH が設定されていません',
      );
    }
    if (!this.PersonalizedProgramEndingFilePath) {
      throw new AppConfigValidationError(
        'PERSONALIZED_PROGRAM_ENDING_FILE_PATH が設定されていません',
      );
    }
    if (!this.PersonalizedProgramSe1FilePath) {
      throw new AppConfigValidationError(
        'PERSONALIZED_PROGRAM_SE_1_FILE_PATH が設定されていません',
      );
    }
    if (!this.PersonalizedProgramSe2FilePath) {
      throw new AppConfigValidationError(
        'PERSONALIZED_PROGRAM_SE_2_FILE_PATH が設定されていません',
      );
    }
    if (!this.PersonalizedProgramSe3FilePath) {
      throw new AppConfigValidationError(
        'PERSONALIZED_PROGRAM_SE_3_FILE_PATH が設定されていません',
      );
    }
    if (!this.PersonalizedProgramPictureFilePath) {
      throw new AppConfigValidationError(
        'PERSONALIZED_PROGRAM_PICTURE_FILE_PATH が設定されていません',
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
    if (this.CloudflareAccessKeyId) {
      if (!this.CloudflareSecretAccessKey) {
        throw new AppConfigValidationError(
          'CLOUDFLARE_SECRET_ACCESS_KEY が設定されていません',
        );
      }
      if (!this.CloudflareR2Endpoint) {
        throw new AppConfigValidationError(
          'CLOUDFLARE_R2_ENDPOINT が設定されていません',
        );
      }
    }
    if (!this.LpDeployHookUrl) {
      throw new AppConfigValidationError(
        'LP_DEPLOY_HOOK_URL が設定されていません',
      );
    }
    if (!this.LpBaseUrl) {
      throw new AppConfigValidationError('LP_BASE_URL が設定されていません');
    }
    // Slack
    if (!this.SlackIncomingWebhookUrl) {
      throw new AppConfigValidationError(
        'SLACK_INCOMING_WEBHOOK_URL が設定されていません',
      );
    }
    // X
    if (this.PostToX === true) {
      this.logger.log('新しい番組を X へポストする設定が有効です');
      if (!this.XApiKey) {
        throw new AppConfigValidationError('X_API_KEY が設定されていません');
      }
      if (!this.XApiSecret) {
        throw new AppConfigValidationError('X_API_SECRET が設定されていません');
      }
      if (!this.XApiAccessToken) {
        throw new AppConfigValidationError(
          'X_API_ACCESS_TOKEN が設定されていません',
        );
      }
      if (!this.XApiAccessSecret) {
        throw new AppConfigValidationError(
          'X_API_ACCESS_SECRET が設定されていません',
        );
      }
    }
    if (!this.FreePlanId) {
      throw new AppConfigValidationError('FREE_PLAN_ID が設定されていません');
    }
    if (!this.ProPlanId) {
      throw new AppConfigValidationError('PRO_PLAN_ID が設定されていません');
    }
    // 設定値のログ出力
    this.logger.log('AppConfigService initialized', {
      V1ApiToken: this.V1ApiToken,
      BackendApiToken: this.BackendApiToken,
      DatabaseUrl: this.DatabaseUrl,
      ShowQueryLogs: this.ShowQueryLogs,
      QiitaAccessToken: this.QiitaAccessToken,
      OpenAiApiKey: this.OpenAiApiKey,
      OpenAiSummarizationModel: this.OpenAiSummarizationModel,
      OpenAiScriptGenerationModel: this.OpenAiScriptGenerationModel,
      ProgramFileGenerationTempDir: this.ProgramFileGenerationTempDir,
      HeadlineTopicProgramTargetDir: this.HeadlineTopicProgramTargetDir,
      HeadlineTopicProgramBgmFilePath: this.HeadlineTopicProgramBgmFilePath,
      HeadlineTopicProgramOpeningFilePath:
        this.HeadlineTopicProgramOpeningFilePath,
      HeadlineTopicProgramEndingFilePath:
        this.HeadlineTopicProgramEndingFilePath,
      HeadlineTopicProgramSeShortFilePath:
        this.HeadlineTopicProgramSeShortFilePath,
      HeadlineTopicProgramSeLongFilePath:
        this.HeadlineTopicProgramSeLongFilePath,
      HeadlineTopicProgramPictureFilePath:
        this.HeadlineTopicProgramPictureFilePath,
      PersonalizedProgramTargetDir: this.PersonalizedProgramTargetDir,
      PersonalizedProgramBgmFilePath: this.PersonalizedProgramBgmFilePath,
      PersonalizedProgramOpeningFilePath:
        this.PersonalizedProgramOpeningFilePath,
      PersonalizedProgramEndingFilePath: this.PersonalizedProgramEndingFilePath,
      PersonalizedProgramSe1FilePath: this.PersonalizedProgramSe1FilePath,
      PersonalizedProgramSe2FilePath: this.PersonalizedProgramSe2FilePath,
      PersonalizedProgramSe3FilePath: this.PersonalizedProgramSe3FilePath,
      PersonalizedProgramPictureFilePath:
        this.PersonalizedProgramPictureFilePath,
      ProgramAudioBucketName: this.ProgramAudioBucketName,
      ProgramAudioFileUrlPrefix: this.ProgramAudioFileUrlPrefix,
      CloudflareAccessKeyId: this.CloudflareAccessKeyId,
      CloudflareSecretAccessKey: this.CloudflareSecretAccessKey,
      CloudflareR2Endpoint: this.CloudflareR2Endpoint,
      LpDeployHookUrl: this.LpDeployHookUrl,
      LpBaseUrl: this.LpBaseUrl,
      GoogleCloudCredentialsFilePath: this.GoogleCloudCredentialsFilePath,
      SlackIncomingWebhookUrl: this.SlackIncomingWebhookUrl,
      PostToX: this.PostToX,
      XApiKey: this.XApiKey,
      XApiSecret: this.XApiSecret,
      XApiAccessToken: this.XApiAccessToken,
      XApiAccessSecret: this.XApiAccessSecret,
      FreePlanId: this.FreePlanId,
      ProPlanId: this.ProPlanId,
    });
  }

  /**
   * V1 API の Bearer Token
   * for ApiV1
   * @returns Bearer Token
   */
  get V1ApiToken(): string {
    return this.config.get<string>('V1_API_ACCESS_TOKEN');
  }

  /**
   * Backend API の Bearer Token
   * @returns Bearer Token
   */
  get BackendApiToken(): string {
    return this.config.get<string>('BACKEND_API_ACCESS_TOKEN');
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
    const showQueryLogs = this.config.get<string>('SHOW_QUERY_LOGS');
    let result = false;
    if (showQueryLogs === 'true') {
      result = true;
    }
    return result;
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
   * 短い効果音ファイルのパス
   */
  get HeadlineTopicProgramSeShortFilePath(): string {
    return this.config.get<string>('HEADLINE_TOPIC_PROGRAM_SE_SHORT_FILE_PATH');
  }

  /**
   * 長い効果音ファイルのパス
   */
  get HeadlineTopicProgramSeLongFilePath(): string {
    return this.config.get<string>('HEADLINE_TOPIC_PROGRAM_SE_LONG_FILE_PATH');
  }

  /**
   * 画像ファイルのパス
   */
  get HeadlineTopicProgramPictureFilePath(): string {
    return this.config.get<string>('HEADLINE_TOPIC_PROGRAM_PICTURE_FILE_PATH');
  }

  /**
   * パーソナライズド番組のターゲットディレクトリ
   */
  get PersonalizedProgramTargetDir(): string {
    return this.config.get<string>('PERSONALIZED_PROGRAM_TARGET_DIR');
  }

  /**
   * パーソナライズド番組用BGMファイルのパス
   */
  get PersonalizedProgramBgmFilePath(): string {
    return this.config.get<string>('PERSONALIZED_PROGRAM_BGM_FILE_PATH');
  }

  /**
   * パーソナライズド番組用オープニングファイルのパス
   */
  get PersonalizedProgramOpeningFilePath(): string {
    return this.config.get<string>('PERSONALIZED_PROGRAM_OPENING_FILE_PATH');
  }

  /**
   * パーソナライズド番組用エンディングファイルのパス
   */
  get PersonalizedProgramEndingFilePath(): string {
    return this.config.get<string>('PERSONALIZED_PROGRAM_ENDING_FILE_PATH');
  }

  /**
   * パーソナライズド番組用効果音1ファイルのパス
   */
  get PersonalizedProgramSe1FilePath(): string {
    return this.config.get<string>('PERSONALIZED_PROGRAM_SE_1_FILE_PATH');
  }

  /**
   * パーソナライズド番組用効果音2ファイルのパス
   */
  get PersonalizedProgramSe2FilePath(): string {
    return this.config.get<string>('PERSONALIZED_PROGRAM_SE_2_FILE_PATH');
  }

  /**
   * パーソナライズド番組用効果音3ファイルのパス
   */
  get PersonalizedProgramSe3FilePath(): string {
    return this.config.get<string>('PERSONALIZED_PROGRAM_SE_3_FILE_PATH');
  }

  /**
   * パーソナライズド番組用画像ファイルのパス
   */
  get PersonalizedProgramPictureFilePath(): string {
    return this.config.get<string>('PERSONALIZED_PROGRAM_PICTURE_FILE_PATH');
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

  /**
   * Cloudflare Access key id
   */
  get CloudflareAccessKeyId(): string {
    return this.config.get<string>('CLOUDFLARE_ACCESS_KEY_ID');
  }

  /**
   * Cloudflare Secret access key
   */
  get CloudflareSecretAccessKey(): string {
    return this.config.get<string>('CLOUDFLARE_SECRET_ACCESS_KEY');
  }

  /**
   * Cloudflare R2 endpoint
   */
  get CloudflareR2Endpoint(): string {
    return this.config.get<string>('CLOUDFLARE_R2_ENDPOINT');
  }

  /**
   * LP 再生成の Deploy Hook URL
   */
  get LpDeployHookUrl(): string {
    return this.config.get<string>('LP_DEPLOY_HOOK_URL');
  }

  /**
   * LP のベース URL
   */
  get LpBaseUrl(): string {
    return this.config.get<string>('LP_BASE_URL');
  }

  /**
   * Google Cloud の認証キーファイルのパス
   */
  get GoogleCloudCredentialsFilePath(): string {
    return this.config.get<string>('GCP_CREDENTIALS_FILE_PATH');
  }

  /**
   * Slack Incoming Webhook URL
   */
  get SlackIncomingWebhookUrl(): string {
    return this.config.get<string>('SLACK_INCOMING_WEBHOOK_URL');
  }

  /**
   * 新しい番組を配信した時に X（Twitter）へポストするかどうか
   */
  get PostToX(): boolean {
    const postToX = this.config.get<string>('POST_TO_X');
    let result = false;
    if (postToX === 'true') {
      result = true;
    }
    return result;
  }

  /**
   * X API Key
   */
  get XApiKey(): string {
    return this.config.get<string>('X_API_KEY');
  }

  /**
   * X API Secret
   */
  get XApiSecret(): string {
    return this.config.get<string>('X_API_SECRET');
  }

  /**
   * X API Access Token
   */
  get XApiAccessToken(): string {
    return this.config.get<string>('X_API_ACCESS_TOKEN');
  }

  /**
   * X API Access Secret
   */
  get XApiAccessSecret(): string {
    return this.config.get<string>('X_API_ACCESS_SECRET');
  }

  /**
   * Free Plan ID
   */
  get FreePlanId(): string {
    return this.config.get<string>('FREE_PLAN_ID');
  }

  /**
   * Pro Plan ID
   */
  get ProPlanId(): string {
    return this.config.get<string>('PRO_PLAN_ID');
  }
}
