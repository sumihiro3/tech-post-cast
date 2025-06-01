import {
  Configuration,
  DashboardApi,
  PersonalizedFeedsApi,
  ProgramContentApiApi,
  QiitaPostsApi,
  UserSettingsApi,
} from '@/api';

export default defineNuxtPlugin((nuxt) => {
  // 開発環境でのデフォルトAPIベースURL
  const apiUrl = nuxt.$config.public.apiUrl || 'http://localhost:3001';

  const options = new Configuration({
    basePath: apiUrl,
  });
  // 各 API を useNuxtApp で利用できるようにする
  return {
    provide: {
      programContentApi: new ProgramContentApiApi(options),
      qiitaPostApi: new QiitaPostsApi(options),
      personalizedFeedApi: new PersonalizedFeedsApi(options),
      userSettingsApi: new UserSettingsApi(options),
      dashboardApi: new DashboardApi(options),
    },
  };
});
