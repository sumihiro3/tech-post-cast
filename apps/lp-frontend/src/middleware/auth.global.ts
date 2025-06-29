const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/app/(.*)']);
const isLoginPage = createRouteMatcher(['/login']);

export default defineNuxtRouteMiddleware(async (to) => {
  console.log('Auth middleware called for:', to.path);

  const { userId, isLoaded } = useAuth();

  // 認証の初期化を待つ（最大5秒間）
  let attempts = 0;
  const maxAttempts = 50; // 5秒間（100ms × 50回）

  while (!isLoaded.value && attempts < maxAttempts) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    attempts++;
  }

  console.log('Auth state:', {
    isLoaded: isLoaded.value,
    userId: userId.value,
    attempts,
    path: to.path,
  });

  // 認証が読み込まれていない場合は処理をスキップ
  if (!isLoaded.value) {
    console.warn('Authentication not loaded, skipping auth middleware');
    return;
  }

  if (userId.value && isLoginPage(to)) {
    // If the user is already signed in, they are redirected to the dashboard
    console.log('Redirecting logged-in user from login page to dashboard');
    return navigateTo('/dashboard');
  }

  // If the user is not signed in, they aren't allowed to access
  // the protected route and are redirected to the sign-in page
  if (!userId.value && isProtectedRoute(to)) {
    console.log('Redirecting unauthenticated user to login page');
    return navigateTo('/login');
  }

  console.log('Auth middleware completed, no redirect needed');
});
