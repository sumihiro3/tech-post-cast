// https://nuxt.com/docs/api/configuration/nuxt-config
import { jaJP } from '@clerk/localizations';
import type { Nitro, NitroConfig } from 'nitropack';
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify';
import type { HeadlineTopicProgramsCountDto } from './src/api';
import generateOembedJsonFiles from './src/scripts/oembed';
import generateSpotifyRssFeed from './src/scripts/rss';

/**
 * ヘッドライントピック番組一覧の各ページのルートを取得する
 * @returns `/pages/{page}` のルートの配列を返す
 */
const getHeadlineTopicProgramListPageRoutes = async (): Promise<string[]> => {
  console.log('getHeadlineTopicProgramListPageRoutes called');
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
  // ルート別のレンダリング戦略
  routeRules: {
    // パブリックページ: SSG
    '/': { prerender: true },
    '/headline-topic-programs/**': { prerender: true },

    // アプリページ: SPA (クライアントサイドのみ)
    '/app/**': { ssr: false },

    // API関連: SSRなし、キャッシュなし
    '/api/**': { ssr: false, cache: false },
  },
  app: {
    head: {
      title: 'Tech Post Cast',
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
      'prerender:config': async (nitroConfig: NitroConfig) => {
        console.log('Nitro hook [prerender:config] called');
        console.dir(nitroConfig, { depth: undefined });
        // ヘッドライントピック番組一覧の各ページのルートを追加
        const headlineTopicProgramListRoutes
          = await getHeadlineTopicProgramListPageRoutes();
        nitroConfig.prerender?.routes?.push(...headlineTopicProgramListRoutes);
      },
      'compiled': async (nitro: Nitro) => {
        // Podcast サービス用の RSS フィードを生成する
        await generateSpotifyRssFeed(nitro);
        // 各番組ページ用の oEmbed JSON ファイルを生成する
        await generateOembedJsonFiles(nitro);
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
      listenerLetterFormUrl: process.env.LISTENER_LETTER_FORM_URL,
      podcastUrls: [
        {
          title: 'Spotify',
          icon: 'mdi-spotify',
          link: 'https://open.spotify.com/show/5RpulDOnvdqKdZc5rZ9jzD?si=c1qN4IknSVeLZYZRUGVz_A',
        },
        {
          title: 'Amazon Music',
          icon: 'mdi-music',
          link: 'https://music.amazon.co.jp/podcasts/edd04dca-b387-41a3-9bb2-fbd183f01f5d/techpostcast',
        },
        {
          title: 'Apple Podcasts',
          icon: 'mdi-apple',
          link: 'https://podcasts.apple.com/us/podcast/tech-post-cast/id1790035669',
        },
        {
          title: 'YouTube',
          icon: 'mdi-youtube',
          link: 'https://www.youtube.com/playlist?list=PLtafUFEHRNL_yFrmYht9Bw1Sec2T8m2Sv',
        },
      ],
      snsUrls: [
        {
          title: 'X',
          icon: 'mdi-twitter',
          link: 'https://x.com/techpostcast',
        },
        {
          title: 'LINE',
          icon: 'mdi-chat-outline',
          link: 'https://lin.ee/a1dD32a',
        },
      ],
    },
  },
  modules: [
    // Vuetify
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    (_options, nuxt) => {
      nuxt.hooks.hook('vite:extendConfig', (config) => {
        // @ts-expect-error
        config.plugins.push(
          vuetify({
            autoImport: true,
            styles: { configFile: '/styles/settings.scss' },
          }),
        );
      });
    },
    // Clerk
    '@clerk/nuxt',
    // nuxt-gtag
    'nuxt-gtag',
    // '@nuxt/eslint'
    '@nuxt/eslint',
  ],
  clerk: {
    localization: jaJP,
  },
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
