import { LineUser, Prisma, PrismaClient } from '@prisma/client';

/**
 * LineUser の Upsert 要求
 */
export interface LineUserUpsertRequest {
  id: string;
  displayName: string;
  isFollowed: boolean;
  followedAt?: Date;
  language?: string;
  pictureUrl?: string;
}

/**
 * LINE USER を新規登録または更新する
 * @param request LineUserUpsertRequest
 * @param prisma PrismaClient
 */
export const upsert = async (
  request: LineUserUpsertRequest,
  prisma: PrismaClient,
): Promise<LineUser> => {
  console.debug(`line-users-repository.findLatest called`);
  const now = new Date();
  // LINE USER を新規登録または更新する
  const result = await prisma.lineUser.upsert({
    where: {
      id: request.id,
    },
    create: {
      id: request.id,
      displayName: request.displayName,
      isFollowed: request.isFollowed,
      followedAt: request.followedAt || now,
      language: request.language,
      pictureUrl: request.pictureUrl,
      createdAt: now,
      updatedAt: now,
    },
    update: createUpdateLineUserQuery(request),
  });
  console.debug(`LINE USER を新規登録または更新しました`, {
    result,
  });
  return result;
};

/**
 * LINE USER の 更新クエリを生成する
 * @param request LineUserUpsertRequest
 * @returns LINE USER の 更新クエリ
 */
const createUpdateLineUserQuery = (
  request: LineUserUpsertRequest,
): Prisma.LineUserUpdateInput => {
  console.debug(`line-users-repository.createUpdateLineUserQuery called`, {
    request,
  });
  const now = new Date();
  const result: Prisma.LineUserUpdateInput = {
    displayName: request.displayName,
    isFollowed: request.isFollowed,
    updatedAt: now,
  };
  if (request.followedAt) {
    result.followedAt = request.followedAt;
  }
  if (request.language) {
    result.language = request.language;
  }
  if (request.pictureUrl) {
    result.pictureUrl = request.pictureUrl;
  }
  console.debug(`LINE USER の 更新クエリを生成しました`, {
    result,
  });
  return result;
};
