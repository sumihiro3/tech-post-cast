import { useAuthGuard } from '~/composables/useAuthGuard';

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/app/(.*)']);
const isLoginPage = createRouteMatcher(['/login']);

export default defineNuxtRouteMiddleware(async (to) => {
  console.log('Auth middleware called for:', to.path);

  const { waitForAuth } = useAuthGuard();

  try {
    // 統一された認証待機処理を使用（10秒タイムアウト）
    const authResult = await waitForAuth({
      maxWaitTime: 10000,
      pollInterval: 100,
      showLoading: false, // グローバルミドルウェアではローディング表示を無効
      showError: false, // エラーメッセージも無効（ログ出力のみ）
    });

    console.log('Auth middleware result:', {
      isAuthenticated: authResult.isAuthenticated,
      userId: authResult.userId,
      error: authResult.error?.code,
      path: to.path,
    });

    // 認証初期化でエラーが発生した場合の処理
    if (authResult.error) {
      console.warn('Auth initialization error:', authResult.error);

      // タイムアウトエラーの場合は処理をスキップ（従来の動作を維持）
      if (authResult.error.code === 'INITIALIZATION_TIMEOUT') {
        console.warn('Authentication initialization timeout, skipping auth middleware');
        return;
      }

      // その他のエラーの場合も処理をスキップ
      console.warn('Authentication error, skipping auth middleware');
      return;
    }

    // 認証済みユーザーがログインページにアクセスした場合
    if (authResult.isAuthenticated && isLoginPage(to)) {
      console.log('Redirecting logged-in user from login page to dashboard');
      return navigateTo('/dashboard');
    }

    // 未認証ユーザーが保護されたルートにアクセスした場合
    if (!authResult.isAuthenticated && isProtectedRoute(to)) {
      console.log('Redirecting unauthenticated user to login page');
      return navigateTo('/login');
    }

    console.log('Auth middleware completed, no redirect needed');
  } catch (error) {
    // 予期しないエラーが発生した場合
    console.error('Unexpected error in auth middleware:', error);

    // エラーが発生した場合は従来のフォールバック処理
    const { userId, isLoaded } = useAuth();

    if (!isLoaded.value) {
      console.warn('Authentication not loaded after error, skipping auth middleware');
      return;
    }

    if (userId.value && isLoginPage(to)) {
      return navigateTo('/dashboard');
    }

    if (!userId.value && isProtectedRoute(to)) {
      return navigateTo('/login');
    }
  }
});
