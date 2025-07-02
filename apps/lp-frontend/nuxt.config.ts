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
  const response = await fetch(`${apiUrl}/api/program-content/headline-topic-programs/count`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token!}`,
    },
  });
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
    // SPAモードでのフォールバック処理を有効化
    https: false,
  },
  devtools: { enabled: true },
  build: {
    transpile: ['vuetify'],
  },
  // SSRを有効にして、routeRulesで個別制御
  ssr: true,
  // SSRハイドレーション問題を軽減
  experimental: {
    payloadExtraction: false,
  },
  // ルート別のレンダリング戦略
  routeRules: {
    // パブリックページ: SSG
    '/': { prerender: true },
    '/headline-topic-programs/**': { prerender: true },

    // ログインページ: SPA (クライアントサイドのみ)
    '/login': {
      ssr: false,
      prerender: false,
    },

    // アプリページ: SPA (クライアントサイドのみ)
    '/app/**': {
      ssr: false,
      prerender: false,
      headers: {
        'cache-control': 'no-cache, no-store, must-revalidate',
        'pragma': 'no-cache',
        'expires': '0',
      },
    },

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
      routes: ['/'], // 最低限のルートを明示的に指定
    },
    // SPAフォールバック設定を強化
    experimental: {
      wasm: true,
    },
    // SSGビルドでのSPAフォールバック設定
    storage: {
      redis: {
        driver: 'memory',
      },
    },
    hooks: {
      'prerender:config': async (nitroConfig: NitroConfig) => {
        console.log('Nitro hook [prerender:config] called');
        console.dir(nitroConfig, { depth: undefined });
        // ヘッドライントピック番組一覧の各ページのルートを追加
        const headlineTopicProgramListRoutes = await getHeadlineTopicProgramListPageRoutes();
        nitroConfig.prerender?.routes?.push(...headlineTopicProgramListRoutes);
      },
      // eslint-disable-next-line @stylistic/quote-props
      compiled: async (nitro: Nitro) => {
        // Podcast サービス用の RSS フィードを生成する
        await generateSpotifyRssFeed(nitro);
        // 各番組ページ用の oEmbed JSON ファイルを生成する
        await generateOembedJsonFiles(nitro);

        // SSGビルド後にSPAフォールバック用の200.htmlを生成
        const fs = await import('fs');
        const path = await import('path');

        const publicDir = nitro.options.output?.publicDir;
        if (publicDir) {
          const indexPath = path.join(publicDir, 'index.html');
          const fallbackPath = path.join(publicDir, '200.html');

          // index.htmlが存在する場合のみ処理
          if (fs.existsSync(indexPath)) {
            // 200.htmlを作成（SPAフォールバック用）
            fs.copyFileSync(indexPath, fallbackPath);
            console.log('Created 200.html for SPA fallback');

            // /app/ 配下へのアクセス用に app/200.html も作成
            const appDir = path.join(publicDir, 'app');
            if (!fs.existsSync(appDir)) {
              fs.mkdirSync(appDir, { recursive: true });
            }
            const appFallbackPath = path.join(appDir, '200.html');
            fs.copyFileSync(indexPath, appFallbackPath);
            console.log('Created app/200.html for SPA fallback');

            // 静的ホスティング用の _redirects ファイルを生成
            const redirectsPath = path.join(publicDir, '_redirects');
            const redirectsContent = [
              '# SPA fallback for /app routes - preserve original URL with force flag',
              '/app/* /200.html 200!',
              '',
              '# Login page fallback - preserve original URL with force flag',
              '/login /200.html 200!',
              '',
              '# Default fallback for other routes',
              '/* /index.html 200',
            ].join('\n');
            fs.writeFileSync(redirectsPath, redirectsContent);
            console.log('Created _redirects file for static hosting');
          } else {
            console.warn('index.html not found, skipping SPA fallback creation');
          }
        }
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
    // 開発サーバーでのSPAフォールバック設定
    server: {
      fs: {
        allow: ['..'],
      },
      // SPAルートのフォールバック処理
      middlewareMode: false,
    },
  },
});
