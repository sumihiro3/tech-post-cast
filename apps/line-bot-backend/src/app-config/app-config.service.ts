import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  private readonly logger = new Logger(AppConfigService.name);

  constructor(private readonly config: ConfigService) {
    // 検証
    if (!this.LineBotChannelSecret) {
      throw new Error('LINE_BOT_CHANNEL_SECRET が設定されていません');
    }
    if (!this.LineBotChannelAccessToken) {
      throw new Error('LINE_BOT_CHANNEL_ACCESS_TOKEN が設定されていません');
    }
    if (!this.ProgramFileUrlPrefix) {
      throw new Error('PROGRAM_AUDIO_FILE_URL_PREFIX が設定されていません');
    }
    if (!this.DatabaseUrl) {
      throw new Error('DATABASE_URL が設定されていません');
    }
    // 設定値のログ出力
    this.logger.log('AppConfigService initialized', {
      LineBotChannelSecret: this.LineBotChannelSecret,
      LineBotChannelAccessToken: this.LineBotChannelAccessToken,
      ProgramFileUrlPrefix: this.ProgramFileUrlPrefix,
      DatabaseUrl: this.DatabaseUrl,
      ShowQueryLogs: this.ShowQueryLogs,
    });
  }

  get LineBotChannelSecret(): string {
    return this.config.get<string>('LINE_BOT_CHANNEL_SECRET');
  }

  get LineBotChannelAccessToken(): string {
    return this.config.get<string>('LINE_BOT_CHANNEL_ACCESS_TOKEN');
  }

  get ProgramFileUrlPrefix(): string {
    return this.config.get<string>('PROGRAM_AUDIO_FILE_URL_PREFIX');
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
}
