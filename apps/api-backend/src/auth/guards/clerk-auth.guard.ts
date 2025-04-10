import { ClerkClient, createClerkClient } from '@clerk/backend';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly logger = new Logger(ClerkAuthGuard.name);

  private readonly clerkClient: ClerkClient;
  private readonly jwtKey: string;

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>('CLERK_SECRET_KEY');
    const publishableKey = this.configService.get<string>(
      'CLERK_PUBLISHABLE_KEY',
    );
    if (!secretKey || !publishableKey) {
      const errorMessage = `CLERK_SECRET_KEY or CLERK_PUBLISHABLE_KEY が設定されていません`;
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }
    this.jwtKey = this.configService.get<string>('CLERK_JWT_KEY');
    if (!this.jwtKey) {
      const errorMessage = `CLERK_JWT_KEY が設定されていません`;
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }
    this.clerkClient = createClerkClient({
      secretKey,
      publishableKey,
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest<Request>();

      // Clerkの authenticateRequest() を使用してリクエストを検証
      const requestState = await this.clerkClient.authenticateRequest(request, {
        jwtKey: this.jwtKey,
      });
      if (!requestState.isSignedIn) {
        // 未認証の場合はエラーを投げる
        throw new UnauthorizedException('ユーザー認証に失敗しました');
      }
      const authObject = requestState.toAuth();
      const { userId, sessionId } = authObject;

      // 認証に失敗した場合はエラーを投げる
      if (!userId || !sessionId) {
        throw new UnauthorizedException('ユーザー認証に失敗しました');
      }
      // リクエストオブジェクトにユーザー情報を追加
      request['user'] = {
        id: userId,
        sessionId: sessionId,
      };
      return true;
    } catch (error) {
      this.logger.error('ユーザー認証に失敗しました', error);
      if (error instanceof Error) {
        this.logger.error(error.message, error.stack);
      }
      throw new UnauthorizedException('ユーザー認証に失敗しました');
    }
  }
}
