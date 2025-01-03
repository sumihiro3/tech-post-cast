import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  private readonly logger = new Logger(AppConfigService.name);

  constructor(private readonly config: ConfigService) {}

  get LineBotChannelSecret(): string {
    return this.config.get<string>('LINE_BOT_CHANNEL_SECRET');
  }

  get LineBotChannelAccessToken(): string {
    return this.config.get<string>('LINE_BOT_CHANNEL_ACCESS_TOKEN');
  }

  get ProgramFileUrlPrefix(): string {
    return this.config.get<string>('PROGRAM_AUDIO_FILE_URL_PREFIX');
  }
}
