import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ClerkAuthGuard } from '../guards/clerk-auth.guard';

/**
 * Clerk認証を適用するデコレータ
 * コントローラーまたはエンドポイントに適用することで、Clerk JWTによる認証を要求します
 */
export function Auth() {
  return applyDecorators(
    UseGuards(ClerkAuthGuard),
    ApiBearerAuth('clerk-jwt'),
    ApiUnauthorizedResponse({ description: '認証に失敗しました' }),
  );
}
