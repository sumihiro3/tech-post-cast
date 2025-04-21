const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/app/(.*)']);
const isLoginPage = createRouteMatcher(['/login']);

export default defineNuxtRouteMiddleware((to) => {
  const { userId } = useAuth();

  if (userId.value && isLoginPage(to)) {
    // If the user is already signed in, they are redirected to the dashboard
    return navigateTo('/dashboard');
  }

  // If the user is not signed in, they aren't allowed to access
  // the protected route and are redirected to the sign-in page
  if (!userId.value && isProtectedRoute(to)) {
    return navigateTo('/login');
  }
});
