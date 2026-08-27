import { createRouter, createWebHistory } from 'vue-router';
import authMiddleware from './middleware/auth-middleware';

const routes = [
  {
    // The public landing page, styled after the original smallworlds.com.
    // Signed-in players never see it: the auth guard sends them to /profile.
    path: '/',
    name: 'home',
    component: () => import('../views/LandingView.vue'),
    meta: { layout: 'auth' },
  },
  {
    path: '/space/:id/',
    name: 'space',
    component: () =>
      import('../views/SpaceView.vue').catch((e) => {
        console.error('[SWX-ROUTER] SpaceView module FAILED to load:', e);
        throw e;
      }),
  },
  {
    path: '/invite',
    name: 'invite',
    component: () => import('../views/InviteView.vue'),
    meta: { layout: 'auth' },
  },
  {
    path: '/login',
    name: 'login',
    component: () =>
      import(/* webpackChunkName: "login" */ '../views/LoginView.vue'),
    meta: { layout: 'auth' },
  },
  {
    path: '/forgot',
    name: 'forgot',
    component: () =>
      import(/* webpackChunkName: "forgot" */ '../views/ForgotView.vue'),
    meta: { layout: 'auth' },
  },
  {
    path: '/profile',
    name: 'profile',
    component: () =>
      import(/* webpackChunkName: "profile" */ '../views/ProfileView.vue'),
    
  },

  {
    path: '/smi',
    name: 'smi',
    component: () =>
      import(/* webpackChunkName: "smi" */ '../views/IframeView.vue'),
    // set page title
  },

  {
    path: '/register',
    name: 'register',
    component: () =>
      import(/* webpackChunkName: "register" */ '../views/RegisterView.vue'),
    meta: { layout: 'auth' },
  },
  
  {
    path: '/:catchAll(.*)*',
    name: 'not-found',
    component: () =>
      import('../views/IframeView.vue'),

  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});
router.beforeEach(authMiddleware);
router.beforeEach((to, from) => {
  console.log(`Navigating from ${from.path} to ${to.path}`);
  return true;
});

// Surface navigation failures that vue-router otherwise swallows silently.
router.onError((err) => {
  console.error('[SWX-ROUTER] navigation error:', err);
});
router.afterEach((to, from, failure) => {
  if (failure) {
    console.error('[SWX-ROUTER] navigation FAILED to ' + to.path + ':', failure);
  } else {
    console.log('[SWX-ROUTER] navigation OK -> ' + to.path);
  }
});

export default router;
