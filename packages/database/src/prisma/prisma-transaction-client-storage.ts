import type { Prisma } from '@prisma/client';
import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Prisma.TransactionClient を保存する AsyncLocalStorage 
 * @see https://nodejs.org/docs/latest-v16.x/api/async_context.html#class-asynclocalstorage
 */
export const prismaTransactionClientStorage = new AsyncLocalStorage<Prisma.TransactionClient | null>();
