import { z } from '@hono/zod-openapi';

/**
 * エラーレスポンスのスキーマ
 */
export const ErrorResponseSchema = z
  .object({
    message: z.string(),
    stackTrace: z.string().optional(),
  })
  .openapi('ErrorResponseSchema');
