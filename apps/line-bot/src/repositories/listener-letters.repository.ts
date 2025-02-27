import { ListenerLetter, PrismaClient } from '@prisma/client';

/**
 * リスナーからのお便りの生成リクエスト
 */
export interface ListenerLetterCreateRequest {
  /** お便りの本文 */
  body: string;

  /** お便りの送信者の名前 */
  penName: string;

  /** お便りの送信者のLINE ユーザーID */
  senderId: string;

  /** お便りの送信日時 */
  sentAt: Date;
}

/**
 * お便りを新規登録する
 */
export const create = async (
  request: ListenerLetterCreateRequest,
  prisma: PrismaClient,
): Promise<ListenerLetter> => {
  console.debug(`listener-letters-repository.create called`, { request });
  const now = new Date();
  // お便りを新規登録する
  const result = await prisma.listenerLetter.create({
    data: {
      body: request.body,
      penName: request.penName,
      senderId: request.senderId,
      sentAt: request.sentAt,
      createdAt: now,
      updatedAt: now,
    },
  });
  console.log(`リスナーからのお便りを新規登録しました`, {
    result,
  });
  return result;
};
