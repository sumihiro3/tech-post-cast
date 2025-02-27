import {
  ErrorResponseSchema,
  ListenerLetterSchema,
  SendListenerLetterSchema,
} from '@/schemas';
import { createRoute, z } from '@hono/zod-openapi';
import { Context } from 'hono';
import { createMiddleware } from 'hono/factory';

type SendListenerLetterSchema = z.infer<typeof SendListenerLetterSchema>;

const liffAccessTokenMiddleware = createMiddleware(
  async (c: Context, next: any) => {
    console.debug(`liffAccessTokenMiddleware called`);
    const authorization = c.req.header('authorization');
    console.debug(`authorization: ${authorization}`);
    if (!authorization) {
      return c.status(401);
    }
    return await next();
  },
);

/**
 * お便りを新規登録するエンドポイントを表すルート
 */
export const sendListenerLetterRoute = createRoute({
  method: 'post',
  path: '/',
  middleware: [liffAccessTokenMiddleware],
  request: {
    body: {
      content: {
        'application/json': {
          schema: SendListenerLetterSchema,
        },
      },
    },
  },
  security: [
    {
      Bearer: [],
    },
  ],
  responses: {
    201: {
      description: 'リスナーからのお便りを送信した',
      content: {
        'application/json': {
          schema: ListenerLetterSchema,
        },
      },
    },
    500: {
      description: 'Internal Server Error',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});
