import { AsyncLocalStorage } from 'node:async_hooks';

// AsyncLocalStorage
// @see https://nodejs.org/docs/latest-v16.x/api/async_context.html#class-asynclocalstorage
export const storage = new AsyncLocalStorage<string>();
