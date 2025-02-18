import { HonoEnv } from '@/middlewares/factory';
import { ListenerLetterCreateRequest } from '@/repositories/listener-letters.repository';
import { SendListenerLetterSchema } from '@/schemas';
import { OpenAPIHono, z } from '@hono/zod-openapi';
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
      const prisma = context.var.prismaClient;
      const createRequest: ListenerLetterCreateRequest = {
        body,
        penName,
        senderId: 'dummy',
        sentAt: new Date(),
      };
      // const letter = await create(createRequest, prisma);
      const letter = {
        id: 'dummy',
        body,
        penName,
        sentAt: new Date(),
      };
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
