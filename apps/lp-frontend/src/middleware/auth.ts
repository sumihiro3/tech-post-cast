import { defineNuxtRouteMiddleware, navigateTo } from '#app';
import { useClerk } from '@clerk/vue';

export default defineNuxtRouteMiddleware((to) => {
  const clerk = useClerk();

  // /app/配下のルートを保護
  if (to.path.startsWith('/app/')) {
    if (!clerk.value?.user) {
      // 未認証の場合はサインインページにリダイレクト
      return navigateTo('/sign-in');
    }
  }
});
