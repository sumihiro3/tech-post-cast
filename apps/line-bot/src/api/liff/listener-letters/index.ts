import { getLineProfile, verifyLiffAccessToken } from '@/external-api/line';
import { HonoEnv } from '@/middlewares/factory';
import {
  create,
  ListenerLetterCreateRequest,
} from '@/repositories/listener-letters.repository';
import { SendListenerLetterSchema } from '@/schemas';
import { OpenAPIHono, z } from '@hono/zod-openapi';
import { ListenerLetter } from '@prisma/client';
import { Context } from 'hono';
import { sendListenerLetterRoute } from './routes';

type SendListenerLetterSchema = z.infer<typeof SendListenerLetterSchema>;

export const listenerLettersApi = new OpenAPIHono<HonoEnv>();

listenerLettersApi.openapi(
  sendListenerLetterRoute,
  async (context: Context<HonoEnv>) => {
    console.debug(`POST /api/liff/listener-letters called`);
    try {
      const validatedBody = await context.req.json<SendListenerLetterSchema>();
      const { body, penName } = validatedBody;
      const bearerToken = context.req.header('authorization');
      if (!bearerToken) {
        return context.json(
          {
            message: 'Bearer トークンが指定されていません',
          },
          400,
        );
      }
      // Verify LIFF access token
      const token = bearerToken.split(' ')[1];
      const validToken = await verifyLiffAccessToken(token);
      if (!validToken) {
        return context.json(
          {
            message: 'Bearer トークンが不正です',
          },
          401,
        );
      }
      const profile = await getLineProfile(token);
      // リスナーからのお便りを新規登録する
      const letter = await createListenerLetter(
        {
          body,
          penName,
          senderId: profile.userId,
          sentAt: new Date(),
        },
        context,
      );
      console.log(`リスナーからのお便りを新規登録しました`, {
        letter,
      });
      return context.json(
        {
          id: letter.id,
          body: letter.body,
          penName: letter.penName,
          sentAt: letter.sentAt,
        },
        201,
      );
    } catch (error) {
      const errorMessage = `リスナーからのお便りの新規登録に失敗しました`;
      console.error(errorMessage, { error });
      if (error instanceof Error) {
        console.error(error, error.stack);
      }
      return context.json(
        {
          message: errorMessage,
        },
        500,
      );
    }
  },
);

// The OpenAPI documentation will be available at /doc
listenerLettersApi.doc('/doc', {
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'Tech Post Cast LIFF API',
  },
});

/**
 * リスナーからのお便りを新規登録する
 * @param request ListenerLetterCreateRequest
 * @param context Context<HonoEnv>
 * @returns 新規登録したお便り
 */
async function createListenerLetter(
  request: ListenerLetterCreateRequest,
  context: Context<HonoEnv>,
): Promise<ListenerLetter> {
  console.debug(`listener-letters-api.createListenerLetter called`, {
    request,
  });
  const prisma = context.var.prismaClient;
  const letter = await create(request, prisma);
  console.log(`リスナーからのお便りを新規登録しました`, {
    letter,
  });
  return letter;
}
