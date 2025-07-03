import axios from 'axios';

export default defineNuxtPlugin(() => {
  axios.interceptors.request.use(async (config) => {
    try {
      // ブラウザのwindowオブジェクトからClerkインスタンスを取得
      const clerk = (
        globalThis as {
          Clerk?: {
            session?: { getToken: (options: { template: string }) => Promise<string | null> };
          };
        }
      ).Clerk;

      if (clerk && clerk.session) {
        const token = await clerk.session.getToken({ template: 'default' });
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (error) {
      console.warn('Failed to get auth token:', error);
    }

    return config;
  });
});
