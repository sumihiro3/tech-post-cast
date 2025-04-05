import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService) {}

  /**
   * Qiita API トークン
   */
  get QiitaAccessToken(): string {
    return this.configService.get<string>('QIITA_API_ACCESS_TOKEN', '');
  }
}
