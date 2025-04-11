import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export abstract class BearerGuardBase implements CanActivate {
  private readonly __logger = new Logger(BearerGuardBase.name);

  /**
   * リクエストオブジェクトより Bearer token を取得する
   * @param request リクエストオブジェクト
   * @returns token
   */
  getBearerTokenFromRequest(request: Request): string {
    this.__logger.debug(`BearerGuardBase.getTokenFromRequest called`);
    let token = request.headers.authorization;
    this.__logger.debug(`Authorization header value: ${token}`);
    // token が Bearer トークンであることを確認
    if (!token || !token.startsWith('Bearer ')) {
      Logger.warn(`Bearer トークンではありません: ${token}`);
      return '';
    }
    token = token.slice(7);
    this.__logger.debug(
      `HTTP Request ヘッダーから Bearer token を抽出しました`,
      {
        token,
      },
    );
    return token;
  }

  /**
   * Bearer token を取得する
   * @returns Bearer token
   * @abstract
   */
  protected abstract getBearerToken(): string;

  /**
   * リクエストヘッダーより Bearer token を取得し、検証結果を返す Guard
   * @param context Context
   * @returns 検証結果
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.__logger.debug(`BearerGuardBase.canActivate called!`);
    const request = context.switchToHttp().getRequest();
    // Get Bearer token
    const token = this.getBearerTokenFromRequest(request);
    // Verify API Key
    const BEARER_TOKEN = this.getBearerToken();
    this.__logger.debug(`BEARER_TOKEN: ${BEARER_TOKEN}`);
    if (BEARER_TOKEN !== token) {
      throw new UnauthorizedException(
        `Bearer token の認証が失敗しました: ${token}`,
      );
    }
    return true;
  }
}

/**
 * プログラムコンテンツAPI用の Bearer token を検証する Guard
 */
export class ProgramContentApiBearerTokenGuard extends BearerGuardBase {
  private readonly logger = new Logger(ProgramContentApiBearerTokenGuard.name);

  constructor(@Inject(ConfigService) private readonly config: ConfigService) {
    super();
  }

  protected getBearerToken(): string {
    this.logger.debug(
      `ProgramContentApiBearerTokenGuard.getBearerToken called!`,
    );
    return this.config.get<string>('PROGRAM_CONTENT_API_ACCESS_TOKEN');
  }
}

/**
 * @deprecated ApiV1BearerTokenGuard は ProgramContentApiBearerTokenGuard に置き換えられました
 */
export class ApiV1BearerTokenGuard extends BearerGuardBase {
  private readonly logger = new Logger(ApiV1BearerTokenGuard.name);

  constructor(@Inject(ConfigService) private readonly config: ConfigService) {
    super();
  }

  protected getBearerToken(): string {
    this.logger.debug(`ApiV1BearerTokenGuard.getBearerToken called!`);

    // 新しい環境変数を優先して使用し、なければ旧環境変数を使用する
    const token =
      this.config.get<string>('PROGRAM_CONTENT_API_ACCESS_TOKEN') ||
      this.config.get<string>('V1_API_ACCESS_TOKEN');

    if (!token) {
      this.logger.warn(
        '環境変数 PROGRAM_CONTENT_API_ACCESS_TOKEN または V1_API_ACCESS_TOKEN が設定されていません',
      );
    }

    return token;
  }
}
