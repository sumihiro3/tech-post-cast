import axios from 'axios';

export default defineNuxtPlugin((_nuxtApp) => {
  const { getToken } = useAuth();

  axios.interceptors.request.use(async (config) => {
    // Clerk のトークンを取得して、API リクエストのヘッダーに追加する
    const token = await getToken.value({ template: 'default' });
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
});
