import { useAuthStore } from '@/stores/auth.js';
import { isElectron } from '../../browser-shim.js';

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
  // 'home' is the public landing page, so a signed-out visitor must be able to
  // reach it - without this it bounced straight to /login and nobody ever saw
  // the front page.
  let exceptionalRoutes = ['home', 'login', 'register', 'invite', 'forgot'];
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

  // The landing page is a website thing. In the desktop client there is no
  // marketing to do - the player has already downloaded and opened the app -
  // and routing '/' there put a second sign-in form in front of the real one.
  // Checked after the session is known so a signed-in player goes straight to
  // their profile rather than bouncing via /login.
  if (isElectron && to.name === 'home') {
    next({ name: hasSession ? 'profile' : 'login' });
    return;
  }

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
    // A signed-in player has no use for the landing page or the sign-in form,
    // so send them to their profile. Redirecting to where we already are
    // throws "redundant navigation", which surfaces as a navigation failure
    // and cancels whatever we were doing.
    if (to.name === 'profile' || from.name === 'profile' || from.path === '/profile') {
      next(false);
      return;
    }
    next({ name: 'profile' });
    return;
  }
  next();
};
