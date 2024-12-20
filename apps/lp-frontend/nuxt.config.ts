// https://nuxt.com/docs/api/configuration/nuxt-config
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify';

/**
 * ポストのルートを取得する
 * @returns `posts/:id` のルートを返す
 */
const getPostRoutes = async () => {
  // const pageLimit = 10;
  const totalCounts = 100;
  // const maxPage = Math.ceil(totalCounts / pageLimit);

  // totalCounts 分のページを作成
  const ids: string[] = Array.from({ length: totalCounts }, (_, i) => (i + 1).toString());
  return ids.map((id: string) => `/posts/${id}`);
}

export default defineNuxtConfig({
  srcDir: 'src/',
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  build: {
    transpile: ['vuetify'],
  },
  ssr: true,
  nitro: {
    static: true,
  },
  hooks: {
    async 'nitro:config'(nitroConfig) {
      const slugs = await getPostRoutes();
      nitroConfig.prerender?.routes?.push(...slugs);
    }
  },
  // Vuetify
  modules: [
    (_options, nuxt) => {
      nuxt.hooks.hook('vite:extendConfig', (config) => {
        // @ts-expect-error
        config.plugins.push(vuetify({ autoImport: true }))
      })
    },
    //...
  ],
  vite: {
    vue: {
      template: {
        transformAssetUrls,
      },
    },
  }
})
