import * as dotenv from 'dotenv';

export class StageConfig {
  /** 環境名 */
  readonly name: string;
  /** 環境名（日本語） */
  readonly nameJp: string;
  /** リソース名のサフィックス */
  readonly suffix: string;
  /** リソース名のサフィックス（アンダーバー） */
  readonly suffixWithUnderBar: string;
  /** リソース名のサフィックス */
  readonly suffixLarge: string;
  /** スタック名 */
  readonly stackName: string;

  /** V1 API Access Token */
  get v1ApiAccessToken(): string {
    return process.env.V1_API_ACCESS_TOKEN || '';
  }

  /** Backend API Access Token */
  get backendApiAccessToken(): string {
    return process.env.BACKEND_API_ACCESS_TOKEN || '';
  }

  /** Qiita API Access Token */
  get qiitaApiAccessToken(): string {
    return process.env.QIITA_API_ACCESS_TOKEN || '';
  }

  /** OpenAI API Key */
  get openAiApiKey(): string {
    return process.env.OPENAI_API_KEY || '';
  }

  /** database URL */
  get databaseUrl(): string {
    return process.env.DATABASE_URL || '';
  }

  /** LINE Bot Channel secret */
  get lineBotChannelSecret(): string {
    return process.env.LINE_BOT_CHANNEL_SECRET || '';
  }

  /** LINE Bot Channel access token */
  get lineBotChannelAccessToken(): string {
    return process.env.LINE_BOT_CHANNEL_ACCESS_TOKEN || '';
  }

  /** Cloudflare access key id */
  get cloudflareAccessKeyId(): string {
    return process.env.CLOUDFLARE_ACCESS_KEY_ID || '';
  }

  /** Cloudflare secret access key */
  get cloudflareSecretAccessKey(): string {
    return process.env.CLOUDFLARE_SECRET_ACCESS_KEY || '';
  }

  /** Cloudflare R2 endpoint */
  get cloudflareR2Endpoint(): string {
    return process.env.CLOUDFLARE_R2_ENDPOINT || '';
  }

  /** 番組ファイルを保存する バケット名 */
  get programFileBucketName(): string {
    return process.env.PROGRAM_AUDIO_BUCKET_NAME || '';
  }
  /** 番組ファイルを公開する URL prefix */
  get programFileUrlPrefix(): string {
    return process.env.PROGRAM_AUDIO_FILE_URL_PREFIX || '';
  }

  /** LP 再生成の Deploy Hook URL */
  get lpDeployHookUrl(): string {
    return process.env.LP_DEPLOY_HOOK_URL || '';
  }

  /** LP のベース URL */
  get lpBaseUrl(): string {
    return process.env.LP_BASE_URL || '';
  }

  /** Google Cloud の認証キーファイル配置パス */
  get gcpCredentialsFilePath(): string {
    return process.env.GCP_CREDENTIALS_FILE_PATH || '';
  }

  /** 新しい番組を配信した時に X（Twitter）へポストするかどうか */
  get postToX(): string {
    return process.env.POST_TO_X || '';
  }

  /** X API Key */
  get xApiKey(): string {
    return process.env.X_API_KEY || '';
  }

  /** XApiSecret */
  get xApiSecret(): string {
    return process.env.X_API_SECRET || '';
  }

  /** XApiAccessToken */
  get xApiAccessToken(): string {
    return process.env.X_API_ACCESS_TOKEN || '';
  }

  /** X API Access Secret */
  get xApiAccessSecret(): string {
    return process.env.X_API_ACCESS_SECRET || '';
  }

  /**
   * AWS Chatbot のワークスペースID
   */
  get awsChatbotSlackWorkspaceId(): string {
    return process.env.AWS_CHATBOT_SLACK_WORKSPACE_ID || '';
  }

  /**
   * Slack の Incoming Webhook URL
   */
  get slackIncomingWebhookUrl(): string {
    return process.env.SLACK_INCOMING_WEBHOOK_URL || '';
  }

  /**
   * エラー通知先の Slack チャンネルID
   */
  get slackChannelId(): string {
    return process.env.SLACK_CHANNEL_ID || '';
  }

  /**
   * 環境が本番環境かどうかを判定する
   * 本番環境の場合は true を返す
   * @returns 環境が本番環境かどうか
   */
  isProduction(): boolean {
    return this.name === 'production';
  }

  /**
   * 環境情報を初期化する
   * @param name 環境名称
   */
  constructor(name: string) {
    let sn = `TechPostCastStack`;
    let s = `develop`;
    let nJp = `開発環境`;
    let dotenvPath = './.env.develop';

    switch (name) {
      case 'develop':
        break;
      case 'production':
        s = ``;
        nJp = `本番環境`;
        dotenvPath = './.env.production';
        break;
      default:
        const errorMessage = `想定外のステージ名 [name: ${name}] が指定されました。`;
        console.error(errorMessage);
        throw new Error(errorMessage);
    }
    dotenv.config({ path: dotenvPath });
    this.name = name;
    if (s.length > 0) {
      this.suffix = `-${s}`;
      this.suffixWithUnderBar = `_${s}`;
      this.suffixLarge = s.charAt(0).toUpperCase() + s.slice(1);
    } else {
      this.suffix = ``;
      this.suffixWithUnderBar = ``;
      this.suffixLarge = ``;
    }
    this.stackName = sn + this.suffixLarge;
    this.nameJp = nJp;
    console.log(`環境情報を初期化しました `, {
      name: this.name,
      nameJp: this.nameJp,
      suffix: this.suffix,
      suffixWithUnderBar: this.suffixWithUnderBar,
      suffixLarge: this.suffixLarge,
      stackName: this.stackName,
      V1_API_ACCESS_TOKEN: this.v1ApiAccessToken,
      BACKEND_API_ACCESS_TOKEN: this.backendApiAccessToken,
      QIITA_API_ACCESS_TOKEN: this.qiitaApiAccessToken,
      OPENAI_API_KEY: this.openAiApiKey,
      DATABASE_URL: this.databaseUrl,
      LINE_BOT_CHANNEL_SECRET: this.lineBotChannelSecret,
      LINE_BOT_CHANNEL_ACCESS_TOKEN: this.lineBotChannelAccessToken,
      CLOUDFLARE_ACCESS_KEY_ID: this.cloudflareAccessKeyId,
      CLOUDFLARE_SECRET_ACCESS_KEY: this.cloudflareSecretAccessKey,
      CLOUDFLARE_R2_ENDPOINT: this.cloudflareR2Endpoint,
      PROGRAM_AUDIO_BUCKET_NAME: this.programFileBucketName,
      PROGRAM_AUDIO_FILE_URL_PREFIX: this.programFileUrlPrefix,
      LP_DEPLOY_HOOK_URL: this.lpDeployHookUrl,
      GCP_CREDENTIALS_FILE_PATH: this.gcpCredentialsFilePath,
      AWS_CHATBOT_SLACK_WORKSPACE_ID: this.awsChatbotSlackWorkspaceId,
      SLACK_CHANNEL_ID: this.slackChannelId,
      SLACK_INCOMING_WEBHOOK_URL: this.slackIncomingWebhookUrl,
    });
  }
}

/**
 * 開発環境用の設定
 */
export const developStageConfig = new StageConfig('develop');

/**
 * 本番環境用の設定
 */
export const productionStageConfig = new StageConfig('production');
