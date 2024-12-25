// https://nuxt.com/docs/api/configuration/nuxt-config
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify';
/**
 * ヘッドライントピック番組ページのルートを取得する
 * @returns `headline-topic-programs/:id` のルートを返す
 */
const getHeadlineTopicProgramPageRoutes = async () => {
  const apiUrl = process.env.API_BASE_URL || 'http://localhost:3000';
  const apiKey = process.env.API_ACCESS_TOKEN || 'test-v1-api-key';
  const response = await fetch(`${apiUrl}/api/v1/headline-topic-program-ids`, {
    method: 'GET',
    headers: {
      'x-api-key': apiKey!,
    },
  });
  const programIds = await response.json();
  console.log(`ヘッドライントピック番組一覧`, { programIds });
  return programIds.map((id: string) => `/headline-topic-programs/${id}`);
};

export default defineNuxtConfig({
  srcDir: 'src/',
  compatibilityDate: '2024-11-01',
  devServer: {
    port: 3333,
  },
  devtools: { enabled: true },
  build: {
    transpile: ['vuetify'],
  },
  ssr: true,
  nitro: {
    static: true,
    prerender: {
      crawlLinks: true,
      failOnError: false,
    },
  },
  runtimeConfig: {
    public: {
      environment: process.env.ENVIRONMENT,
      version: process.env.npm_package_version,
      apiUrl: process.env.API_BASE_URL,
      apiAccessToken: process.env.API_ACCESS_TOKEN,
    },
  },
  hooks: {
    async 'nitro:config'(nitroConfig) {
      // ヘッドライントピック番組ページのルートを追加
      const headlineTopicProgramRoutes =
        await getHeadlineTopicProgramPageRoutes();
      nitroConfig.prerender?.routes?.push(...headlineTopicProgramRoutes);
    },
  },
  // Vuetify
  modules: [
    (_options, nuxt) => {
      nuxt.hooks.hook('vite:extendConfig', (config) => {
        // @ts-expect-error
        config.plugins.push(vuetify({ autoImport: true }));
      });
    },
  ],
  vite: {
    vue: {
      template: {
        transformAssetUrls,
      },
    },
  },
});
