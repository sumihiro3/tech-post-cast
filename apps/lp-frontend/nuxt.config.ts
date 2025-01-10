// https://nuxt.com/docs/api/configuration/nuxt-config
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify';
import type { HeadlineTopicProgramsCountDto } from './src/api';

/**
 * ヘッドライントピック番組一覧の各ページのルートを取得する
 * @returns `/?page={page}` のルートの配列を返す
 */
const getHeadlineTopicProgramListPageRoutes = async () => {
  const apiUrl = process.env.API_BASE_URL;
  const token = process.env.API_ACCESS_TOKEN;
  console.log(`API_BASE_URL: ${apiUrl}`);
  console.log(`API_ACCESS_TOKEN: ${token}`);
  const response = await fetch(
    `${apiUrl}/api/v1/headline-topic-programs/count`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token!}`,
      },
    },
  );
  const dto = (await response.json()) as HeadlineTopicProgramsCountDto;
  console.log(`ヘッドライントピック番組一覧`, { programs: dto });
  const programsPerPage = Number(process.env.PROGRAMS_PER_PAGE);
  const pageCount = Math.ceil(dto.count / programsPerPage);
  console.log(`ヘッドライントピック番組一覧のページ数`, {
    programCount: dto.count,
    perPagePrograms: programsPerPage,
    pageCount,
  });
  const routes = [];
  for (let p = 1; p <= pageCount; p++) {
    routes.push(`/headline-topic-programs/pages/${p}`);
  }
  return routes;
};

/**
 * ヘッドライントピック番組ページのルートを取得する
 * @returns `headline-topic-programs/:id` のルートを返す
 */
const getHeadlineTopicProgramPageRoutes = async () => {
  const apiUrl = process.env.API_BASE_URL;
  const token = process.env.API_ACCESS_TOKEN;
  const response = await fetch(`${apiUrl}/api/v1/headline-topic-program-ids`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token!}`,
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
      failOnError: true,
    },
  },
  runtimeConfig: {
    public: {
      environment: process.env.ENVIRONMENT,
      version: process.env.npm_package_version,
      apiUrl: process.env.API_BASE_URL,
      apiAccessToken: process.env.API_ACCESS_TOKEN,
      programsPerPage: process.env.PROGRAMS_PER_PAGE,
    },
  },
  // hooks: https://nuxt.com/docs/api/configuration-hooks
  hooks: {
    // ビルド前にヘッドライントピック番組一覧の各ページのルートを追加
    async 'nitro:config'(nitroConfig) {
      // ヘッドライントピック番組一覧の各ページのルートを追加
      const headlineTopicProgramListRoutes =
        await getHeadlineTopicProgramListPageRoutes();
      nitroConfig.prerender?.routes?.push(...headlineTopicProgramListRoutes);
      // // ヘッドライントピック番組ページのルートを追加
      // const headlineTopicProgramRoutes =
      //   await getHeadlineTopicProgramPageRoutes();
      // nitroConfig.prerender?.routes?.push(...headlineTopicProgramRoutes);
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
