// https://nuxt.com/docs/api/configuration/nuxt-config
import type { NitroConfig } from 'nitropack';
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify';
import type { HeadlineTopicProgramsCountDto } from './src/api';
import generateSpotifyRssFeed from './src/scripts/rss';

/**
 * ヘッドライントピック番組一覧の各ページのルートを取得する
 * @returns `/?page={page}` のルートの配列を返す
 */
const getHeadlineTopicProgramListPageRoutes = async () => {
  const apiUrl = process.env.API_BASE_URL;
  const token = process.env.API_ACCESS_TOKEN;
  const programsPerPage = Number(process.env.PROGRAMS_PER_PAGE || 10);
  console.log(`API_BASE_URL: ${apiUrl}`);
  console.log(`API_ACCESS_TOKEN: ${token}`);
  console.log(`PROGRAMS_PER_PAGE: ${programsPerPage}`);
  if (!apiUrl || !token) {
    console.warn('API_BASE_URL または API_ACCESS_TOKEN が設定されていません');
    return [];
  }
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
  console.log(`ヘッドライントピック番組数`, { programs: dto });
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
  app: {
    head: {
      title: 'TechPostCast',
      htmlAttrs: {
        lang: 'ja',
      },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { hid: 'description', name: 'description', content: '' },
        { name: 'format-detection', content: 'telephone=no' },
      ],
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
    },
  },
  nitro: {
    static: true,
    prerender: {
      crawlLinks: true,
      failOnError: true,
    },
    hooks: {
      compiled: generateSpotifyRssFeed,
      'prerender:config': async (nitroConfig: NitroConfig) => {
        console.log('Nitro hook [prerender:config] called');
        console.dir(nitroConfig, { depth: undefined });
        // ヘッドライントピック番組一覧の各ページのルートを追加
        const headlineTopicProgramListRoutes =
          await getHeadlineTopicProgramListPageRoutes();
        nitroConfig.prerender?.routes?.push(...headlineTopicProgramListRoutes);
      },
    },
  },
  runtimeConfig: {
    public: {
      environment: process.env.ENVIRONMENT,
      version: process.env.npm_package_version,
      apiUrl: process.env.API_BASE_URL,
      apiAccessToken: process.env.API_ACCESS_TOKEN,
      programsPerPage: process.env.PROGRAMS_PER_PAGE,
      lpUrl: process.env.LP_BASE_URL,
      siteName: process.env.LP_SITE_NAME,
      siteSummary: process.env.LP_SITE_SUMMARY,
      siteDescription: process.env.LP_SITE_DESCRIPTION,
      siteOgpImageUrl: process.env.LP_SITE_OGP_IMAGE_URL,
      podcastImageUrl: process.env.PODCAST_IMAGE_URL,
      podcastAuthorName: process.env.PODCAST_AUTHOR_NAME,
      podcastAuthorEmail: process.env.PODCAST_AUTHOR_EMAIL,
      podcastProgramDescription: process.env.PODCAST_PROGRAM_DESCRIPTION,
    },
  },
  modules: [
    // Vuetify
    (_options, nuxt) => {
      nuxt.hooks.hook('vite:extendConfig', (config) => {
        // @ts-expect-error
        config.plugins.push(
          vuetify({
            autoImport: true,
          }),
        );
      });
    },
    // nuxt-gtag
    'nuxt-gtag',
  ],
  gtag: {
    id: process.env.GA_MEASUREMENT_ID,
  },
  vite: {
    vue: {
      template: {
        transformAssetUrls,
      },
    },
  },
});
