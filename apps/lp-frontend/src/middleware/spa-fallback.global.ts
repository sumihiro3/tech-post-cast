import { useAuthGuard } from '~/composables/useAuthGuard';

export default defineNuxtRouteMiddleware(async (to) => {
  console.log('SPA fallback middleware called for:', to.path);

  // SPAルート（/app/**）の処理
  if (to.path.startsWith('/app/')) {
    // 開発環境では SPAフォールバックを無効にする
    if (import.meta.dev) {
      console.log('Development environment, skipping SPA fallback');
      return;
    }

    const { waitForAuth } = useAuthGuard();

    try {
      // 認証状態を確実に待機（本番環境のみ）
      console.log('Waiting for authentication initialization in SPA fallback...');

      const authResult = await waitForAuth({
        maxWaitTime: 8000, // グローバルミドルウェアより短く設定
        pollInterval: 100,
        showLoading: true, // SPAフォールバック時はローディング表示
        showError: false, // エラーメッセージは無効（ログ出力のみ）
      });

      console.log('SPA fallback auth result:', {
        isAuthenticated: authResult.isAuthenticated,
        userId: authResult.userId,
        error: authResult.error?.code,
        path: to.path,
      });

      // 認証初期化でエラーが発生した場合
      if (authResult.error) {
        console.warn('Auth error in SPA fallback:', authResult.error);

        // タイムアウトまたは初期化失敗の場合、ログインページにリダイレクト
        if (authResult.error.code === 'INITIALIZATION_TIMEOUT' ||
          authResult.error.code === 'INITIALIZATION_FAILED') {
          console.warn('Auth initialization failed, redirecting to login');
          return navigateTo('/login');
        }

        // 認証が必要なエラーの場合もログインページへ
        if (authResult.error.code === 'AUTHENTICATION_REQUIRED') {
          console.warn('Authentication required, redirecting to login');
          return navigateTo('/login');
        }
      }

      // 認証済みユーザーの場合のみルート存在チェックを実行
      if (authResult.isAuthenticated) {
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

        console.log('SPA fallback completed, route is valid');
      } else {
        // 未認証ユーザーは auth.global.ts に処理を委ねる
        console.log('User not authenticated, delegating to auth middleware');
      }
    } catch (error) {
      // 予期しないエラーが発生した場合
      console.error('Unexpected error in SPA fallback middleware:', error);

      // フォールバック: 従来の処理
      const { userId, isLoaded } = useAuth();

      // 認証がロードされていない場合はログインページへ
      if (!isLoaded.value) {
        console.warn('Authentication not loaded in SPA fallback, redirecting to login');
        return navigateTo('/login');
      }

      // ログインしていない場合は認証ミドルウェアに任せる
      if (!userId.value) {
        console.log('User not authenticated in fallback, delegating to auth middleware');
        return;
      }

      // 認証済みの場合はルートチェックのみ実行
      if (import.meta.client && import.meta.env.MODE === 'production') {
        const router = useRouter();
        const route = router.resolve(to.path);

        if (route.matched.length === 0) {
          console.warn(`Route not found in fallback: ${to.path}, redirecting to dashboard`);
          return navigateTo('/app/dashboard');
        }
      }
    }
  }
});
