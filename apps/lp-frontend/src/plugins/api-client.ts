import { Configuration, ProgramContentApiApi, QiitaPostsApi } from '@/api';

// eslint-disable-next-line @stylistic/arrow-parens
export default defineNuxtPlugin(nuxt => {
  const options = new Configuration({
    basePath: nuxt.$config.public.apiUrl,
  });
  // 各 API を useNuxtApp で利用できるようにする
  return {
    provide: {
      programContentApi: new ProgramContentApiApi(options),
      qiitaPostApi: new QiitaPostsApi(options),
    },
  };
});
