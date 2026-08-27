<template>
  <div class="sw2018">
    <!-- ── header ─────────────────────────────────────────────── -->
    <header class="lp-header">
      <div class="lp-shell lp-header-inner">
        <img class="lp-logo" src="/img/sw2018/logo.png" alt="SmallWorlds" />
        <nav class="lp-header-links">
          <a href="/download/">Download</a>
          <router-link :to="{ name: 'register' }">Sign up</router-link>
        </nav>
      </div>
    </header>

    <!-- ── hero ───────────────────────────────────────────────── -->
    <section class="lp-hero">
      <!-- The original cycled six photographs of the world behind the header.
           Each is stacked and cross-faded rather than swapped, so there is no
           flash between frames. -->
      <div
        v-for="(bg, i) in heroFrames"
        :key="bg"
        class="lp-hero-frame"
        :class="{ 'is-active': i === frame }"
        :style="{ backgroundImage: `url(${bg})` }"
      />
      <div class="lp-hero-overlay" />

      <div class="lp-shell lp-hero-inner">
        <div class="lp-hero-copy">
          <h1 class="lp-headline">Your Virtual World of Possibilities.</h1>
          <p class="lp-sub">
            Build a home, decorate it however you like, and wander a world full
            of shops, arcades and places to meet people. Free to play.
          </p>
          <router-link class="lp-btn lp-btn-signup" :to="{ name: 'register' }">
            Sign up free
          </router-link>
        </div>

        <!-- ── sign-in box ───────────────────────────────────── -->
        <form class="lp-login" @submit.prevent="submit">
          <label class="lp-field">
            <input
              v-model.trim="email"
              type="email"
              autocomplete="username"
              placeholder="E-mail address..."
              :disabled="busy"
            />
          </label>
          <label class="lp-field">
            <input
              v-model="password"
              type="password"
              autocomplete="current-password"
              placeholder="Password..."
              :disabled="busy"
            />
          </label>

          <label class="lp-remember">
            <input v-model="remember" type="checkbox" :disabled="busy" />
            <span>Keep me logged in</span>
          </label>

          <p v-if="error" class="lp-error">{{ error }}</p>

          <button class="lp-btn lp-btn-login" type="submit" :disabled="busy">
            {{ busy ? 'Signing in…' : 'Login' }}
          </button>

          <router-link class="lp-forgot" :to="{ name: 'forgot' }">
            Forgot Password?
          </router-link>
        </form>
      </div>
    </section>

    <!-- ── features ───────────────────────────────────────────── -->
    <section class="lp-features">
      <div class="lp-shell lp-feature-grid">
        <article v-for="f in features" :key="f.title" class="lp-feature">
          <img class="lp-feature-icon" :src="f.icon" :alt="''" aria-hidden="true" />
          <h2>{{ f.title }}</h2>
          <p>{{ f.body }}</p>
        </article>
      </div>
    </section>

    <!-- ── offer ──────────────────────────────────────────────── -->
    <section class="lp-offer">
      <div class="lp-shell lp-offer-inner">
        <h2 class="lp-offer-title">Starting out</h2>
        <p class="lp-offer-sub">Every new citizen begins with:</p>
        <ul class="lp-offer-list">
          <li>a starter home of your own</li>
          <li>a free pet to play with</li>
          <li>tokens and gold to spend</li>
          <li>a wardrobe to make yours</li>
        </ul>
        <router-link class="lp-btn lp-btn-signup" :to="{ name: 'register' }">
          Create your account
        </router-link>
      </div>
    </section>

    <!-- ── footer ─────────────────────────────────────────────── -->
    <footer class="lp-footer">
      <div class="lp-shell">
        <nav class="lp-footer-links">
          <a href="/download/">Download</a>
          <router-link :to="{ name: 'register' }">Sign up</router-link>
          <router-link :to="{ name: 'login' }">Sign in</router-link>
        </nav>
        <p class="lp-footer-note">
          SmallWorlds &middot; playsmallworlds.com
        </p>
      </div>
    </footer>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { useMeta } from 'vue-meta';
import { useAuthStore } from '@/stores/auth.js';

const HERO_FRAMES = [
  '/img/sw2018/header_background_vid_b1.jpg',
  '/img/sw2018/header_background_vid_b2.jpg',
  '/img/sw2018/header_background_vid_b3.jpg',
  '/img/sw2018/header_background_vid_b4.jpg',
  '/img/sw2018/header_background_vid_b5.jpg',
  '/img/sw2018/header_background_vid_b6.jpg',
];

export default defineComponent({
  name: 'LandingView',

  setup() {
    useMeta({ title: 'SmallWorlds' });
    return { auth: useAuthStore() };
  },

  data() {
    return {
      email: '',
      password: '',
      remember: true,
      busy: false,
      error: '',
      frame: 0,
      timer: null,
      heroFrames: HERO_FRAMES,
      features: [
        {
          title: 'Collect Everything!',
          body: 'Thousands of items to collect and show off.',
          icon: '/img/sw2018/globe_icon_collect_everything.png',
        },
        {
          title: 'A Real Social Sim',
          body: 'Chat, hang out and play games with people around the world.',
          icon: '/img/sw2018/globe_icon_a_real_social_sim.png',
        },
        {
          title: 'Love Your Pet',
          body: 'Adopt a free pet to play with!',
          icon: '/img/sw2018/globe_icon_love_your_pet.png',
        },
        {
          title: 'Make Friends',
          body: 'Meet other citizens and have great adventures.',
          icon: '/img/sw2018/globe_icon_make_friends.png',
        },
        {
          title: 'Start Creating',
          body: 'Endlessly paint, sculpt, decorate, plant, & craft great items.',
          icon: '/img/sw2018/globe_icon_start_creating.png',
        },
        {
          title: 'Personalize It!',
          body: 'Countless ways to customize & dress-up in your unique style.',
          icon: '/img/sw2018/globe_icon_personalize_it.png',
        },
      ],
    };
  },

  mounted() {
    // Preload the frames so the first cross-fade does not show empty space.
    HERO_FRAMES.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
    this.timer = setInterval(() => {
      this.frame = (this.frame + 1) % HERO_FRAMES.length;
    }, 6000);
  },

  beforeUnmount() {
    if (this.timer) clearInterval(this.timer);
  },

  methods: {
    async submit() {
      if (this.busy) return;
      this.error = '';
      if (!this.email || !this.password) {
        this.error = 'Enter your e-mail address and password.';
        return;
      }
      this.busy = true;
      try {
        // Reuses the app's own auth store rather than re-implementing the
        // login call, so session state lands in exactly the same shape the
        // rest of the client expects.
        await this.auth.login({
          email: this.email,
          password: this.password,
        });
        this.$router.push({ name: 'profile' });
      } catch (e) {
        this.error =
          e && e.message === 'Bad credentials'
            ? 'That e-mail address and password do not match.'
            : 'Could not sign in just now. Please try again.';
      } finally {
        this.busy = false;
      }
    },
  },
});
</script>

<style scoped>
/* Palette lifted from the 2018 site: the blue used on headings, the orange
   used on the sign-up button and section eyebrows, and the grey it set body
   copy in. */
.sw2018 {
  --lp-blue: #0d68b1;
  --lp-blue-dark: #166ab0;
  --lp-cyan: #25b2e1;
  --lp-orange: #f96348;
  --lp-green: #94b509;
  --lp-ink: #434343;
  --lp-navy: #323754;

  background: #fff;
  color: var(--lp-ink);
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  line-height: 1.55;
  min-height: 100%;
}

.lp-shell {
  max-width: 1040px;
  margin: 0 auto;
  padding: 0 20px;
}

/* ── header ─────────────────────────────────────────────────── */
.lp-header {
  background: #fff;
  border-bottom: 1px solid #e4eaf1;
}
.lp-header-inner {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-top: 12px;
  padding-bottom: 12px;
}
.lp-logo {
  height: 46px;
  width: auto;
  display: block;
}
.lp-header-links {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 22px;
}
.lp-header-links a {
  color: var(--lp-blue);
  text-decoration: none;
  font-size: 15px;
  font-weight: 600;
}
.lp-header-links a:hover {
  text-decoration: underline;
}

/* ── hero ───────────────────────────────────────────────────── */
.lp-hero {
  position: relative;
  overflow: hidden;
  min-height: 460px;
  display: flex;
  align-items: center;
  background: #0b2a45;
}
.lp-hero-frame {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  opacity: 0;
  transition: opacity 1.4s ease;
}
.lp-hero-frame.is-active {
  opacity: 1;
}
.lp-hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(11, 42, 69, 0.28) 0%,
    rgba(11, 42, 69, 0.52) 100%
  );
}
.lp-hero-inner {
  position: relative;
  display: flex;
  align-items: center;
  gap: 40px;
  padding-top: 48px;
  padding-bottom: 48px;
  width: 100%;
}
.lp-hero-copy {
  flex: 1 1 auto;
  min-width: 0;
}
.lp-headline {
  margin: 0 0 12px;
  color: #fff;
  font-size: clamp(26px, 3.6vw, 38px);
  line-height: 1.15;
  text-wrap: balance;
  text-shadow: 0 2px 12px rgba(0, 20, 40, 0.55);
}
.lp-sub {
  margin: 0 0 22px;
  color: #e8f1fa;
  font-size: 17px;
  max-width: 46ch;
  text-shadow: 0 1px 8px rgba(0, 20, 40, 0.5);
}

/* ── buttons ────────────────────────────────────────────────── */
.lp-btn {
  display: inline-block;
  border: 0;
  border-radius: 6px;
  padding: 13px 26px;
  font-size: 17px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  font-family: inherit;
}
.lp-btn-signup {
  background: var(--lp-orange);
  color: #fff;
  box-shadow: 0 3px 0 #c94a33;
}
.lp-btn-signup:hover {
  background: #fa7259;
}
.lp-btn-login {
  width: 100%;
  background: var(--lp-blue);
  color: #fff;
  box-shadow: 0 3px 0 #0a4f87;
}
.lp-btn-login:hover:not(:disabled) {
  background: #1477c6;
}
.lp-btn:disabled {
  opacity: 0.65;
  cursor: default;
}

/* ── sign-in box ────────────────────────────────────────────── */
.lp-login {
  flex: 0 0 288px;
  background: rgba(255, 255, 255, 0.96);
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 10px 30px rgba(0, 20, 40, 0.32);
}
.lp-field {
  display: block;
  margin-bottom: 10px;
}
.lp-field input {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #c9d5e2;
  border-radius: 5px;
  padding: 11px 12px;
  font-size: 15px;
  font-family: inherit;
  color: var(--lp-ink);
  background: #fff;
}
.lp-field input:focus {
  outline: 2px solid var(--lp-cyan);
  outline-offset: 1px;
  border-color: var(--lp-cyan);
}
.lp-remember {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #5d6b7a;
  margin-bottom: 14px;
  cursor: pointer;
}
.lp-error {
  margin: 0 0 12px;
  color: #c0392b;
  font-size: 14px;
}
.lp-forgot {
  display: block;
  margin-top: 12px;
  text-align: center;
  color: var(--lp-blue);
  font-size: 14px;
  text-decoration: none;
}
.lp-forgot:hover {
  text-decoration: underline;
}

/* ── features ───────────────────────────────────────────────── */
.lp-features {
  padding: 54px 0 46px;
  background: #f6fffe;
}
.lp-feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 34px 30px;
}
.lp-feature {
  text-align: center;
}
.lp-feature-icon {
  width: 92px;
  height: auto;
  display: block;
  margin: 0 auto 12px;
}
.lp-feature h2 {
  margin: 0 0 6px;
  color: var(--lp-blue);
  font-size: 21px;
}
.lp-feature p {
  margin: 0;
  font-size: 15px;
  color: #5d6b7a;
  max-width: 32ch;
  margin-inline: auto;
}

/* ── offer ──────────────────────────────────────────────────── */
.lp-offer {
  padding: 52px 0;
  background: #fff;
  border-top: 1px solid #e9eef4;
}
.lp-offer-inner {
  text-align: center;
}
.lp-offer-title {
  margin: 0 0 4px;
  color: var(--lp-orange);
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.lp-offer-sub {
  margin: 0 0 18px;
  color: var(--lp-blue);
  font-size: 30px;
  font-weight: 700;
}
.lp-offer-list {
  list-style: none;
  margin: 0 0 26px;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px 28px;
  color: var(--lp-ink);
  font-size: 16px;
}
.lp-offer-list li::before {
  content: '✦';
  color: var(--lp-green);
  margin-right: 8px;
}

/* ── footer ─────────────────────────────────────────────────── */
.lp-footer {
  background: var(--lp-navy);
  color: #c3cbdd;
  padding: 26px 0;
  text-align: center;
}
.lp-footer-links {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px 22px;
  margin-bottom: 10px;
}
.lp-footer-links a {
  color: #dfe6f3;
  font-size: 14px;
  text-decoration: none;
}
.lp-footer-links a:hover {
  text-decoration: underline;
}
.lp-footer-note {
  margin: 0;
  font-size: 13px;
  color: #98a3bd;
}

/* ── narrow screens ─────────────────────────────────────────── */
@media (max-width: 860px) {
  .lp-hero-inner {
    flex-direction: column;
    align-items: stretch;
    gap: 26px;
  }
  .lp-login {
    flex: 1 1 auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  .lp-hero-frame {
    transition: none;
  }
}
</style>
