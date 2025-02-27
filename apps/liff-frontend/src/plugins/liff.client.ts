import liff from '@line/liff';

export default defineNuxtPlugin(async () => {
  // const config = useRuntimeConfig();
  // const LIFF_ID = config.public.LIFF_ID;
  // console.log('LIFF_ID', LIFF_ID);
  // await liff.init({ liffId: LIFF_ID })
  //   .then((res) => {
  //     console.log('LIFF initialization succeeded', res);
  //   })
  //   .catch((error) => {
  //     console.error('LIFF initialization failed', error);
  //     throw error;
  //   });
  return {
    provide: {
      liff,
    },
  };
});
