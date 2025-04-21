import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import * as jwksClient from 'jwks-rsa';

@Injectable()
export class ClerkJwtGuard implements CanActivate {
  private readonly logger = new Logger(ClerkJwtGuard.name);

  private readonly client: jwksClient.JwksClient;

  private readonly isTestMode: boolean;
  private readonly testUserId: string;
  private readonly testSessionId: string;

  constructor(private readonly configService: ConfigService) {
    // テストモードかどうかを環境変数から取得
    this.isTestMode =
      this.configService.get<string>('NODE_ENV') === 'test' ||
      this.configService.get<boolean>('TEST_MODE') === true;
    // テストユーザー情報を環境変数から取得
    this.testUserId =
      this.configService.get<string>('TEST_USER_ID') || 'test-user-id';
    this.testSessionId =
      this.configService.get<string>('TEST_SESSION_ID') || 'test-session-id';

    if (this.isTestMode) {
      this.logger.log('テストモードで実行中: 認証をバイパスします');
      // テストモードではClerkClientは初期化しない
      return;
    }
    // 本番環境ではClerkClientを初期化する
    this.logger.log('本番環境で実行中: ClerkClientを初期化します');
    const jwksUri = this.configService.get<string>('CLERK_JWKS_URI');
    this.client = jwksClient({
      jwksUri,
    });
  }

  private getKey = (header, callback) => {
    this.client.getSigningKey(header.kid, (err, key) => {
      const signingKey = key.getPublicKey();
      callback(null, signingKey);
    });
  };

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    // テストモードの場合は認証をスキップ
    if (this.isTestMode) {
      req['user'] = {
        id: this.testUserId,
        sessionId: this.testSessionId,
      };
      return true;
    }
    // 本番環境の場合はJWTを検証
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('トークンが見つかりません');
    }
    try {
      const decoded = await new Promise<any>((resolve, reject) => {
        jwt.verify(
          token,
          this.getKey,
          { algorithms: ['RS256'] },
          (err, decoded) => {
            if (err) reject(err);
            else resolve(decoded);
          },
        );
      });
      // 認証成功したユーザー情報をリクエストに追加
      req.user = {
        id: decoded.sub,
        sessionId: decoded.sid,
      };
      return true;
    } catch (error) {
      this.logger.error('トークンの検証に失敗しました', error);
      if (error instanceof Error) {
        this.logger.error(error.message, error.stack);
      }
      throw new UnauthorizedException('トークンの検証に失敗しました');
    }
  }
}
