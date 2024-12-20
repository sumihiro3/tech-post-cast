import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export abstract class ApiKeyGuardBase implements CanActivate {
  private readonly __logger = new Logger(ApiKeyGuardBase.name);

  /**
   * リクエストオブジェクトより API Key (x-api-key) を取得する
   * @param request リクエストオブジェクト
   * @returns API Key
   */
  protected getApiKeyFromRequest(request: Request): string {
    this.__logger.debug(`ApiKeyGuardBase.getApiKeyFromRequest called`);
    let key = request.headers['x-api-key'];
    if (key instanceof Array) {
      key = key[0];
    }
    this.__logger.debug(`HTTP Request ヘッダーから API Key を抽出しました`, {
      key,
    });
    return key;
  }

  /**
   * API Key を取得する
   * @returns API Key
   * @abstract
   */
  protected abstract getApiKey(): string;

  /**
   * リクエストヘッダーより API Key を取得し、検証結果を返す Guard
   * @param context Context
   * @returns 検証結果
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.__logger.debug(`ApiKeyGuardBase.canActivate called!`);
    const request = context.switchToHttp().getRequest();
    // Get API Key
    const key = this.getApiKeyFromRequest(request);
    // Verify API Key
    const API_KEY = this.getApiKey();
    this.__logger.debug(`API_KEY: ${API_KEY}`);
    if (API_KEY !== key) {
      throw new UnauthorizedException(`API Key の認証が失敗しました: ${key}`);
    }
    return true;
  }
}

/**
 * API v1 用の API Key を検証する Guard
 */
export class ApiV1ApiKeyGuard extends ApiKeyGuardBase {
  private readonly logger = new Logger(ApiV1ApiKeyGuard.name);

  constructor(@Inject(ConfigService) private readonly config: ConfigService) {
    super();
  }

  protected getApiKey(): string {
    this.logger.debug(`ApiV1ApiKeyGuard.getApiKey called!`);
    return this.config.get<string>('V1_API_KEY');
  }
}
