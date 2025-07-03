export default defineNuxtPlugin(() => {
  const router = useRouter();

  // SSGビルドでのSPAフォールバック処理
  if (import.meta.client) {
    // SPAルートの処理
    const handleSpaRoute = (): void => {
      const currentPath = window.location.pathname;

      // /app/ で始まるルートの場合
      if (currentPath.startsWith('/app/')) {
        // 現在のルートがルーターに存在するかチェック
        const route = router.resolve(currentPath);

        if (route.name === undefined || route.matched.length === 0) {
          // ルートが存在しない場合、ルーターを使って適切に処理
          router.push(currentPath).catch(() => {
            // ルーティングに失敗した場合、ページをリロード
            window.location.reload();
          });
        }
      }
    };

    // ページロード時に実行
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', handleSpaRoute);
    } else {
      handleSpaRoute();
    }

    // ルート変更時の処理
    router.beforeEach((to, from, next) => {
      // SPAルートの場合、適切に処理
      if (to.path.startsWith('/app/')) {
        next();
      } else {
        next();
      }
    });
  }
});
