import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

/**
 * ApiV1 のアクセス制限を行うガード
 * Bearer Token による認証を行う
 */
@Injectable()
export class ApiV1BearerTokenGuard implements CanActivate {
  private readonly logger = new Logger(ApiV1BearerTokenGuard.name);

  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    // リクエストを取得する
    const req = context.switchToHttp().getRequest<Request>();
    // 認証ヘッダーを取得する
    const authHeader = req.headers.authorization;
    this.logger.debug('authHeader', { authHeader });
    if (!authHeader) {
      throw new UnauthorizedException('Authorization header not found');
    }
    // Bearer トークンかどうかを確認する
    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid token format');
    }
    // トークンを取得する
    const token = authHeader.slice(7);
    this.logger.debug('token', { token });
    // トークンが空の場合はエラー
    if (!token) {
      throw new UnauthorizedException('Token is empty');
    }
    // .env から ApiV1 のトークンを取得する
    const configApiToken = this.configService.get<string>('API_V1_TOKEN');
    this.logger.debug('configApiToken', { configApiToken });
    // 認証トークンとマッチするかどうかを確認する
    if (token !== configApiToken) {
      throw new UnauthorizedException('Invalid token');
    }
    return true;
  }
}
