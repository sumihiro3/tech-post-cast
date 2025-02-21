// https://nuxt.com/docs/api/configuration/nuxt-config
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify';

export default defineNuxtConfig({
  srcDir: 'src/',
  compatibilityDate: '2024-11-01',
  devServer: {
    port: 4444,
  },
  devtools: { enabled: true },
  ssr: false,
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
  runtimeConfig: {
    public: {
      environment: process.env.ENVIRONMENT,
      version: process.env.npm_package_version,
      NODE_ENV: process.env.NODE_ENV,
      LOG_LEVEL: process.env.LOG_LEVEL,
      LIFF_ID: process.env.LIFF_ID,
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
    // nuxt-gtag
    'nuxt-gtag',
    // '@nuxt/eslint'
    '@nuxt/eslint',
  ],
  vite: {
    vue: {
      template: {
        transformAssetUrls,
      },
    },
  },
});
