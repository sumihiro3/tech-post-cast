import liff from '@line/liff';

export default defineNuxtPlugin((nuxtApp) => {
  const runtimeConfig = useRuntimeConfig();
  const liffId = runtimeConfig.public.LIFF_ID;

  /**
   * Vue アプリ初期化完了時に LIFF を初期化する
   */
  nuxtApp.hook('app:created', async () => {
    console.log(`Lifecycle hook [app:created] called`);
    if (!liffId) {
      throw new Error('LIFF IDがセットされていません。');
    }
    // LIFF の初期化
    try {
      console.log(`LIFF の初期化を開始します: ${liffId}`);
      await liff.init({ liffId });
      console.log(`LIFF の初期化が完了しました: ${liffId}`);
      if (!liff.isLoggedIn()) {
        liff.login({ redirectUri: location.href });
      }
    }
    catch (error) {
      console.error(`LIFF の初期化に失敗しました`, error);
      throw error;
    }
  });
});
