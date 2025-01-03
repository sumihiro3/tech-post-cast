import { ApiV1Api, Configuration } from '@/api';

export default defineNuxtPlugin((nuxt) => {
  const options = new Configuration({
    basePath: nuxt.$config.public.apiUrl,
  });
  // 各 API を useNuxtApp で利用できるようにする
  return {
    provide: {
      apiV1: new ApiV1Api(options),
    },
  };
});
