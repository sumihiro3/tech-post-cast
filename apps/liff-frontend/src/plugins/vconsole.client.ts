import VConsole from 'vconsole';

export default defineNuxtPlugin((/* nuxtApp */) => {
  return {
    provide: {
      VConsole,
    },
  };
});
