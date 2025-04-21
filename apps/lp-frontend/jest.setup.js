// テスト環境用のセットアップ
// TextEncoder/TextDecoderのpolyfill
import { TextDecoder, TextEncoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Nuxt アプリケーションのモック
// #app モジュールのモックを避け、直接必要な関数をモック
global.useRuntimeConfig = jest.fn(() => ({
  public: {
    apiBaseUrl: 'http://localhost:3000',
  },
}));

global.useNuxtApp = jest.fn(() => ({
  $qiitaPostApi: {
    searchQiitaPosts: jest.fn(),
  },
  $personalizedFeedsApi: {
    createPersonalizedFeed: jest.fn(),
    updatePersonalizedFeed: jest.fn(),
    getPersonalizedFeed: jest.fn(),
    getPersonalizedFeeds: jest.fn(),
    deletePersonalizedFeed: jest.fn(),
  },
}));

// axiosのモック
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  })),
  isAxiosError: jest.fn(),
}));
