import { Configuration, DefaultApi } from '@/api';

export default defineNuxtPlugin((_nuxt) => {
  const runtimeConfig = useRuntimeConfig();
  const options = new Configuration({
    basePath: runtimeConfig.public.apiUrl,
  });
  return {
    provide: {
      defaultApi: new DefaultApi(options),
    },
  };
});
