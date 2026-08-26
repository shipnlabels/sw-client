import { useAuthStore } from '@/stores/auth.js';

export default async (to, from, next) => {
  const auth = useAuthStore();
  // initialize auth state — must be awaited, it reads from async electron storage.
  // Without the await, isLoggedIn is still false on the first check and the
  // navigation gets bounced to /login, so entering a space took many clicks.
  // Must not be allowed to reject: a rejected guard aborts navigation outright.
  try {
    await auth.initialize();
  } catch (e) {
    console.error('auth.initialize() failed, continuing with current state:', e);
  }
  let exceptionalRoutes = ['login', 'register', 'invite', 'forgot'];
  let isGoingExceptionalRoutes = exceptionalRoutes.includes(to.name);

  // A stored session token is proof of login even if isLoggedIn hasn't been
  // rehydrated yet — without this the first guard pass bounces to /login, and
  // the follow-up bounce back to home discards the original navigation.
  const hasSession = Boolean(auth.isLoggedIn || auth.token || (auth.session && auth.session.SWSID));

  console.log(
    `[SWX-AUTH] to=${String(to.name)} from=${String(from.name)} ` +
    `isLoggedIn=${auth.isLoggedIn} token=${Boolean(auth.token)} ` +
    `session=${Boolean(auth.session)} -> hasSession=${hasSession}`
  );

  /**
   * IF THE USER IS NOT LOGGED IN
   */
  if (!hasSession) {
    if (isGoingExceptionalRoutes) {
      next(); // The user is not logged in but it's going to exceptional routes ? fine
      return;
    } else {
      console.log('[SWX-AUTH] no session -> redirecting to login');
      next({ name: 'login' });
      return;
    } // other routes than exceptional paths => /login
  }

  /**
   * IF THE USER IS LOGGED IN
   */
  if (isGoingExceptionalRoutes) {
    // Already on home: redirecting again throws "redundant navigation", which
    // surfaces as a navigation failure and cancels whatever we were doing.
    if (from.name === 'home' || from.path === '/') {
      next(false);
      return;
    }
    next({ name: 'home' });
    return;
  }
  next();
};
