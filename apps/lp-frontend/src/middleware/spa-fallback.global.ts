export default defineNuxtRouteMiddleware((to) => {
  // SPAルート（/app/**）の処理
  if (to.path.startsWith('/app/')) {
    // SSGビルドでクライアントサイドの場合
    if (import.meta.client && import.meta.env.MODE === 'production') {
      // ルートが存在するかチェック
      const router = useRouter();
      const route = router.resolve(to.path);

      if (route.matched.length === 0) {
        // 存在しないルートの場合、ダッシュボードにリダイレクト
        console.warn(`Route not found: ${to.path}, redirecting to dashboard`);
        return navigateTo('/app/dashboard');
      }
    }
  }
});
