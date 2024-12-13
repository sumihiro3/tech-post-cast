import { AppConfigService } from '@/app-config/app-config.service';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  RawBodyRequest,
} from '@nestjs/common';
import { createHmac } from 'crypto';
import { Observable } from 'rxjs';

@Injectable()
export class LineBotSignatureGuard implements CanActivate {
  constructor(private readonly appConfig: AppConfigService) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<RawBodyRequest<Request>>();
    const body = request.rawBody;
    const secret = this.appConfig.LineBotChannelSecret;
    // LINE BOT Channel Secret
    const signature = createHmac('SHA256', secret)
      .update(body)
      .digest('base64');
    // リクエストヘッダーの署名
    const requestedSignature: string = request['headers']['x-line-signature'];
    // リクエストヘッダーの署名と、LINE BOT Channel Secret で生成した署名が一致するかを検証する
    if (!requestedSignature) return false;
    if (signature !== requestedSignature) return false;
    return true;
  }
}
