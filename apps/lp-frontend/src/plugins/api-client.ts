import { ApiV1Api, Configuration } from '@/api';

export default defineNuxtPlugin((nuxt) => {
  const options = new Configuration({
    basePath: nuxt.$config.public.apiUrl as string,
    accessToken: () => nuxt.$config.public.apiAccessToken as string,
  });

  const modules = {
    apiV1: new ApiV1Api(options),
  };

  return {
    provide: modules,
  };
});
