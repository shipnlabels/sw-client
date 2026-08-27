<script setup>
import { ref, onMounted, watch } from 'vue';
import { useUserStore } from '@stores/user.js';
import { WebSocketService } from '@/services/websocket';

const user = useUserStore();
const userState = ref(null);

onMounted(async () => {
  try {
    const uState = await window.storage.getItem('USER_INFO');
    if (uState && uState !== 'undefined') {
      userState.value = JSON.parse(uState);
    }
  } catch (e) {
    console.error('Failed to parse USER_INFO:', e);
  }
});

// Watch WebSocket messages
watch(WebSocketService.message, (newVal) => {
  if (newVal.action === 'userBalanceUpdate') {
    user.goldBalance = newVal.goldBalance;
    user.tokensBalance = newVal.tokensBalance;
    if (userState.value) {
      userState.value.goldBalance = newVal.goldBalance;
      userState.value.tokensBalance = newVal.tokensBalance;
      window.storage.removeItem('USER_INFO');
      window.storage.setItem('USER_INFO', JSON.stringify(userState.value));
    }
  }
});
</script>


<template>
  <!-- Browser-style chrome, the arrangement the original is known for:
       history controls and an address bar on the left so a space link can be
       pasted or shared, then navigation, the mark, and the wallet. -->
  <header class="tw-bar">
    <div class="tw-history">
      <button class="tw-round" title="Back" @click="goBack">
        <i class="fa-solid fa-arrow-left" />
      </button>
      <button class="tw-round" title="Forward" @click="goForward">
        <i class="fa-solid fa-arrow-right" />
      </button>
      <button class="tw-round" title="Reload" @click="reloadPage">
        <i class="fa-solid fa-rotate-right" />
      </button>
    </div>

    <form class="tw-url" @submit.prevent="goToUrl">
      <i class="fa-solid fa-link tw-url-icon" />
      <input
        v-model="urlInput"
        class="tw-url-input"
        type="text"
        spellcheck="false"
        :placeholder="currentUrl"
        @focus="$event.target.select()"
      />
    </form>

    <nav class="tw-nav">
      <button
        v-for="link in links"
        :key="link.key"
        class="tw-nav-btn"
        :class="{ 'is-active': isActiveLink(link.key),
                  'is-disabled': link.key === 'home' && !homeSpaceId }"
        :title="link.key === 'home' && !homeSpaceId
                ? 'This avatar has no home space yet' : ''"
        @click="goNav(link.key)"
      >{{ link.label }}</button>
    </nav>

    <img class="tw-logo" src="/img/smallworlds-logo.svg" alt="SmallWorlds" />

    <div class="tw-right">
      <!-- The only level/gold/token readout in the app. The title bar used to
           show a second copy while in a space; that one is gone. -->
      <div class="tw-wallet">
        <span class="tw-coin">
          <img src="/icon_primary.png" alt="Level" />
          <b class="v-level">{{ user.defaultAvatar?.avatarXPs?.primary?.level || 0 }}</b>
        </span>
        <span class="tw-coin">
          <img src="/balance_gold.png" alt="Gold" />
          <b class="v-gold">{{ numberWithCommas(user.goldBalance || 0) }}</b>
        </span>
        <span class="tw-coin">
          <img src="/balance_token.png" alt="Tokens" />
          <b class="v-token">{{ numberWithCommas(user.tokensBalance || 0) }}</b>
        </span>
      </div>

      <button class="tw-icon-btn" title="Sign out" @click="logout">
        <i class="fa-solid fa-right-from-bracket" />
      </button>
    </div>
  </header>
</template>

<script>
import { useUserStore } from '@stores/user.js';
export default {
  name: 'CurrencyHeader',
  data() {
    return {
      // Only destinations that actually exist. Adding Forum/Store/Help before
      // they are built would just be dead chrome.
      links: [
        { key: 'home',    label: 'HOME' },
        { key: 'profile', label: 'PROFILE' },
      ],
      urlInput: '',
      user: useUserStore(),
      background: 'tc_bg.png',
      vip: false,
    };
  },
  computed: {
    /** The current avatar's home space, sent with the avatar payload. */
    homeSpaceId() {
      return this.user?.defaultAvatar?.homeSpaceId || null;
    },

    /** True while the player is inside a space, where the Flash client draws
        its own level/gold/token readout. */
    inSpace() {
      return (this.$route?.path || '').startsWith('/space');
    },

    /** Shown as the address-bar placeholder so players can see and copy the
        link for wherever they currently are. A real https URL rather than a
        smallworlds:// scheme nothing can open - these get pasted into Discord,
        and a link to the site is one anybody can actually click. */
    currentUrl() {
      const p = this.$route?.path || '/profile';
      const origin =
        (typeof window !== 'undefined' && window.location && window.location.origin &&
         window.location.origin.indexOf('http') === 0)
          ? window.location.origin
          : 'https://playsmallworlds.com';
      return `${origin}${p}`;
    },
  },

  methods: {
    //add commas to numbers
    isActiveLink(key) {
      const p = this.$route?.path || '';
      return key === 'home' ? p.startsWith('/space') : p.startsWith('/profile');
    },

    goNav(key) {
      if (key === 'profile') {
        if (!this.$route.path.startsWith('/profile')) this.$router.push('/profile');
        return;
      }
      // HOME drops you into the selected avatar's own space.
      const id = this.homeSpaceId;
      if (!id) return;
      this.$router.push({ name: 'space', params: { id: String(id) } });
    },

    goBack() {
      this.$router.back();
    },
    goForward() {
      this.$router.forward();
    },
    reloadPage() {
      window.location.reload();
    },

    /**
     * Accept anything that identifies a space and go there: a full share link,
     * a /space/<id> path, or a bare id. This is what makes space links
     * shareable between players.
     */
    goToUrl() {
      const raw = (this.urlInput || '').trim();
      if (!raw) return;

      // Spaces are addressed by numeric id OR by alias (/space/smallwear/), and
      // both forms get pasted around, so accept either. Matching only \d+ sent
      // every alias link to the profile instead.
      const m =
        raw.match(/space\/([A-Za-z0-9_-]+)/i) ||
        raw.match(/^#?([A-Za-z0-9_-]+)$/);
      if (m && !raw.startsWith('/profile')) {
        this.$router.push({ name: 'space', params: { id: m[1] } });
      } else if (raw.startsWith('/')) {
        this.$router.push(raw);
      } else {
        this.$router.push({ name: 'profile' });
      }
      this.urlInput = '';
    },

    async logout() {
      try {
        const { useAuthStore } = await import('@stores/auth.js');
        await useAuthStore().logout();
      } catch (e) {
        console.error('logout failed:', e);
      }
      window.location.href = '/login';
    },
    numberWithCommas(x) {
      if (!x && x !== 0) return '0';
      return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },
    // if month is december, set background to holidayBG.png
    backgroundChange() {
      let date = new Date();
      let month = date.getMonth();
      if (month == 11) {
        this.background = 'holidayBG.png';
      }
    },
    hasVIP() {
      if (!this.user.permissions) return false;
      for (let i = 0; i < this.user.permissions.length; i++) {
        if (this.user.permissions[i].value == 90) {
          return true;
        }
      }
      return false;
    },

  },
  mounted() {
    this.backgroundChange();
    this.vip = this.hasVIP();
  },

};
</script>

<style scoped>
.tw-bar {
  gap: 12px;
  background: linear-gradient(180deg, #263d61 0%, var(--sw-navy) 100%);
  border-bottom: 3px solid var(--sw-steel);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 0 18px;
  height: 52px;
  position: relative;
  z-index: 10;
}

/* ---- history + address bar ---- */

.tw-history {
  display: flex;
  gap: 3px;
  flex-shrink: 0;
}

.tw-round {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.09);
  color: #b9cbe4;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease, color 0.15s ease;
}

.tw-round:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

/* Address bar: paste a space link to travel there, or copy the placeholder
   to share where you are. */
.tw-url {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.28);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 100px;
  padding: 0 14px;
  height: 30px;
  min-width: 190px;
  max-width: 340px;
  flex: 1 1 240px;
}

.tw-url:focus-within {
  border-color: var(--sw-sky);
  background: rgba(0, 0, 0, 0.38);
}

.tw-url-icon {
  color: #7f97b8;
  font-size: 11px;
  flex-shrink: 0;
}

.tw-url-input {
  background: none;
  border: none;
  outline: none;
  color: #e8f0fb;
  font-family: var(--sw-font);
  font-size: 12px;
  width: 100%;
}

.tw-url-input::placeholder {
  color: #8ba3c2;
}

/* ---- navigation ---- */

.tw-nav {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tw-nav-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  font-family: var(--sw-font);
  font-size: 13px;
  letter-spacing: 0.5px;
  color: #cddcf2;
  text-decoration: none;
  padding: 7px 16px;
  border-radius: 5px;
  transition: background 0.15s ease, color 0.15s ease;
}

.tw-nav-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

/* Current page reads green, the way the original marked the active tab. */
.tw-nav-btn.is-disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.tw-nav-btn.is-disabled:hover {
  background: transparent;
  color: #cddcf2;
}

.tw-nav-btn.is-active {
  background: var(--sw-green);
  color: #fff;
  font-weight: bold;
  box-shadow: 0 2px 0 var(--sw-green-dark);
}

/* ---- mark ---- */

.tw-logo {
  height: 46px;
  width: auto;
  display: block;
  flex-shrink: 0;
}

/* ---- balances ---- */

.tw-right {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

.tw-wallet {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--sw-steel);
  border-radius: 100px;
  padding: 3px 10px 3px 4px;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.25);
}

.tw-coin {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 0 6px;
  font-family: var(--sw-font);
  font-size: 14px;
  white-space: nowrap;
}

.tw-coin img {
  width: 24px;
  height: 24px;
  object-fit: contain;
  flex-shrink: 0;
}

.tw-coin b {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
}

.v-level { color: #d7f4ff; }
.v-gold  { color: var(--sw-gold); }
.v-token { color: #ffd9a8; }

.tw-icon-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.1);
  color: #cddcf2;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease, color 0.15s ease;
}

.tw-icon-btn:hover {
  background: rgba(255, 90, 90, 0.85);
  color: #fff;
}

@media only screen and (max-width: 820px) {
  .tw-logo { height: 34px; }
  .tw-coin { font-size: 12px; padding: 0 3px; }
  .tw-coin img { width: 19px; height: 19px; }
}
</style>
