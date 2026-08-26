<template>
  <div class="sw-page login-page">
    <div class="sw-page-background" />

    <div class="login-wrap">
      <div class="sw-panel login-card">
        <div class="sw-panel-header">
          <div class="sw-panel-title">Sign in</div>
          <div class="sw-online" style="margin-left: auto">
            <span class="sw-online-dot" :class="{ 'is-offline': !online }" />
            <span>{{ online ? 'Servers online' : 'Connecting…' }}</span>
          </div>
        </div>

        <h1 class="welcome">Welcome back</h1>
        <p class="tagline">Your world is waiting.</p>

        <form @submit.prevent="handleLogin">
          <label class="field">
            <span class="field-label">Email</span>
            <input
              v-model.trim="credentials.email"
              type="email"
              autocomplete="username"
              placeholder="you@example.com"
              :class="{ 'has-error': touched.email && !emailV }"
            />
            <span v-if="touched.email && !emailV" class="field-error">
              Enter a valid email address.
            </span>
          </label>

          <label class="field">
            <span class="field-label">Password</span>
            <input
              v-model="credentials.password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              placeholder="••••••••"
              :class="{ 'has-error': touched.password && !passwordV }"
              @keydown.enter="handleLogin"
            />
            <button
              type="button"
              class="peek"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
              @click="showPassword = !showPassword"
            >
              <i :class="showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'" />
            </button>
            <span v-if="touched.password && !passwordV" class="field-error">
              Password must be at least 6 characters.
            </span>
          </label>

          <div class="row-between">
            <label class="remember">
              <input v-model="credentials.remember" type="checkbox" />
              <span>Remember me</span>
            </label>
            <router-link class="sw-link" to="/forgot">Forgot password?</router-link>
          </div>

          <button class="sw-btn-green login-btn" type="submit" :disabled="busy">
            {{ busy ? 'Signing in…' : 'Enter World' }}
          </button>
        </form>

        <div class="sw-panel-footer login-footer">
          <span class="footer-prompt">New here?</span>
          <router-link class="sw-btn-quiet create-btn" to="/register">
            <i class="fa-solid fa-user-plus" />
            <span>Create an account</span>
          </router-link>
        </div>
      </div>
    </div>

    <snackBar :snackbar="snackbar" />
  </div>
</template>

<script>
import { postAuthDestination } from '../browser-shim.js';
import { reactive } from 'vue';
import { useAuthStore } from '@stores/auth';
import snackBar from '@components/utils/snackBar.vue';

const auth = useAuthStore();

const EMAIL_RE =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,24}))$/;

export default {
  name: 'LoginComponent',
  components: { snackBar },

  data: () => ({
    credentials: reactive({
      email: '',
      password: '',
      remember: false,
    }),
    // Tracked explicitly rather than assigned ad hoc, so the template can
    // show per-field errors only after the user has actually typed.
    touched: { email: false, password: false },
    emailV: false,
    passwordV: false,
    showPassword: false,
    busy: false,
    online: true,
    snackbar: {
      visible: false,
      text: '',
      color: '',
      icon: '',
      timeout: null,
      offset: '',
    },
  }),

  methods: {
    triggerSnackbar(data) {
      this.snackbar.visible = data.visible;
      this.snackbar.text = data.text;
      this.snackbar.color = data.color;
      this.snackbar.icon = data.icon;
      this.snackbar.timeout = data.timeout;
      this.snackbar.offset = data.offset;
      setTimeout(() => {
        this.snackbar.visible = false;
      }, this.snackbar.timeout);
    },

    async handleLogin() {
      this.touched.email = true;
      this.touched.password = true;

      if (!this.emailV || !this.passwordV) {
        this.triggerSnackbar({
          visible: true,
          text: !this.emailV
            ? 'Enter a valid email address.'
            : 'Password must be at least 6 characters.',
          color: 'red',
          timeout: 6000,
          icon: 'mdi-alert-circle',
          offset: 'left',
        });
        return;
      }

      this.busy = true;
      try {
        if (await auth.login(this.credentials)) {
          await window.storage.setItem('SWSID', JSON.stringify(auth.session));
          window.location.href = postAuthDestination();
          return;
        }
        // auth.login resolved falsy - credentials were rejected
        this.triggerSnackbar({
          visible: true,
          text: 'Invalid credentials.',
          color: 'red',
          timeout: 6000,
          icon: 'mdi-alert-circle',
          offset: 'left',
        });
      } catch (error) {
        this.triggerSnackbar({
          visible: true,
          text: 'Invalid credentials.',
          color: 'red',
          timeout: 6000,
          icon: 'mdi-alert-circle',
          offset: 'left',
        });
        console.log(error);
      } finally {
        this.busy = false;
      }
    },

    // Single cheap probe purely to drive the "Servers online" dot in the
    // header - no polling, no avatar artwork.
    checkOnline() {
      fetch('/api/space/time')
        .then((r) => {
          this.online = r.ok;
        })
        .catch(() => {
          this.online = false;
        });
    },
  },

  mounted() {
    this.checkOnline();
  },

  watch: {
    'credentials.email': function (val) {
      this.emailV = EMAIL_RE.test(val);
      if (val) this.touched.email = true;
    },
    'credentials.password': function (val) {
      this.passwordV = val.length >= 6;
      if (val) this.touched.password = true;
    },
  },
};
</script>

<style scoped>
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.login-wrap {
  width: 100%;
  max-width: 400px;
}

.login-card {
  display: flex;
  flex-direction: column;
  padding-bottom: 0;
}

/* Header sits flush against the welcome block now that nothing overlaps it. */
.login-card .sw-panel-header {
  margin-bottom: 24px;
}

.welcome {
  font-family: var(--sw-font);
  font-size: 22pt;
  color: var(--sw-navy);
  text-align: center;
  margin: 0;
}

.tagline {
  text-align: center;
  color: #7a7a7a;
  font-size: 13px;
  margin: 6px 0 24px 0;
}

.field {
  display: block;
  position: relative;
  margin-bottom: 14px;
}

.field-label {
  display: block;
  font-size: 12px;
  color: #555;
  margin-bottom: 4px;
  font-weight: 500;
}

.field input[type='email'],
.field input[type='password'],
.field input[type='text'] {
  width: 100%;
  height: 38px;
  padding: 0 38px 0 12px;
  border: 1px solid var(--sw-border-soft);
  border-radius: 4px;
  font-family: inherit;
  font-size: 14px;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  box-sizing: border-box;
}

.field input:focus {
  border-color: var(--sw-steel);
  box-shadow: 0 0 0 3px rgba(85, 116, 167, 0.18);
}

.field input.has-error {
  border-color: #d9534f;
}

.field-error {
  display: block;
  color: #d9534f;
  font-size: 11px;
  margin-top: 3px;
}

.peek {
  position: absolute;
  right: 8px;
  top: 26px;
  height: 32px;
  width: 28px;
  background: none;
  border: none;
  color: #9aa9c0;
  cursor: pointer;
}

.peek:hover {
  color: var(--sw-steel);
}

.row-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.remember {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #555;
  cursor: pointer;
}

.remember input {
  width: 16px;
  height: 16px;
  accent-color: var(--sw-green);
  cursor: pointer;
}

.login-btn {
  width: 100%;
  height: 45px;
  font-size: 18px;
  margin-bottom: 20px;
}

.login-footer {
  display: flex;
  gap: 10px;
  align-items: center;
}

.footer-prompt {
  font-size: 13px;
  color: #6b7684;
}

.create-btn {
  flex: 1;
  text-decoration: none;
  color: #333;
}

.create-link {
  flex-shrink: 0;
  white-space: nowrap;
}
</style>
