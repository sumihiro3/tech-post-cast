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

  /**
   * Free Plan ID
   */
  get FreePlanId(): string {
    return this.configService.get<string>('FREE_PLAN_ID', '');
  }

  /**
   * Pro Plan ID
   */
  get ProPlanId(): string {
    return this.configService.get<string>('PRO_PLAN_ID', '');
  }
}
