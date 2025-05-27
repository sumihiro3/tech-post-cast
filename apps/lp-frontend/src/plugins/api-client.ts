import {
  Configuration,
  PersonalizedFeedsApi,
  ProgramContentApiApi,
  QiitaPostsApi,
  UserSettingsApi,
} from '@/api';

export default defineNuxtPlugin((nuxt) => {
  const options = new Configuration({
    basePath: nuxt.$config.public.apiUrl,
  });
  // 各 API を useNuxtApp で利用できるようにする
  return {
    provide: {
      programContentApi: new ProgramContentApiApi(options),
      qiitaPostApi: new QiitaPostsApi(options),
      personalizedFeedApi: new PersonalizedFeedsApi(options),
      userSettingsApi: new UserSettingsApi(options),
    },
  };
});
