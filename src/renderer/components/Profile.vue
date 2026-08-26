<template>
  <div class="sw-page">
    <div class="sw-page-background" />

    <div class="profile-container">
      <!-- Left: greeting, quick panels, destinations -->
      <div class="column-main">
        <div class="sw-panel profile-info">
          <div class="sw-panel-header">
            <div class="sw-online">
              <span
                class="sw-online-dot"
                :class="{ 'is-offline': onlineUsers < 1 }"
              />
              <span>{{ onlineUsers }} online</span>
            </div>
            <div class="sw-clock">
              <i class="fa-regular fa-clock" />
              <span class="clock-time">{{ clock }}</span>
            </div>
          </div>

          <div class="welcome-message">Welcome back! Whats first?</div>

          <!-- The three classic panel shortcuts. Each opens its Flash panel
               through the same dialog the old widget column used. -->
          <div class="action-boxes">
            <div
              v-for="box in actionBoxes"
              :key="box.name"
              class="action-box"
              :class="{ 'is-unavailable': box.unavailable }"
              role="button"
              tabindex="0"
              @click="triggerDialog(box)"
              @keydown.enter="triggerDialog(box)"
            >
              <img :src="box.img" :alt="box.label" />
              <span v-if="box.unavailable" class="action-soon">Coming soon</span>
            </div>
          </div>
          <div class="action-labels">
            <div v-for="box in actionBoxes" :key="box.name" class="action-label">
              {{ box.status }}
            </div>
          </div>

          <div class="destination-section">
            <spacesLayout
              :spaces="spaces"
              :rightActive="rightActive"
              :leftActive="leftActive"
              :mySpacesActive="mySpacesActive"
              :favsActive="favsActive"
              :featuredActive="featuredActive"
              :popularActive="popularActive"
              :msg="msg"
              @changeTab="changeTab"
              @nextSpace="nextSpace"
              @prevSpace="prevSpace"
              @navigateToSpace="navigateToSpace"
            />
          </div>
        </div>

        <button
          class="sw-btn-green enter-world-btn"
          :disabled="!homeSpaceId"
          :title="homeSpaceId ? 'Go to your space' : 'You do not own a space yet'"
          @click="enterWorld"
        >
          Enter World
        </button>
      </div>

      <!-- Right: avatar picker, then progression -->
      <div class="column-avatar">
        <aviLayout :user="user" @triggerSnackbar="triggerSnackbar" />

        <div class="addon-container">
          <div class="skills-header">Skills in progress</div>
          <div class="addon-divider" />
          <div class="addon-content">
            <div class="skills-progress">
              <div v-for="row in skillRows" :key="row[0].key" class="skills-row">
                <div v-for="sk in row" :key="sk.key" class="skill-item">
                  <div
                    class="skill-circle"
                    :style="{ '--percent': sk.pct, '--skill-color': sk.color }"
                  >
                    <img class="skill-img" :src="sk.icon" :alt="sk.label" />
                  </div>
                  <div class="skill-name">{{ sk.label }}</div>
                  <div class="skill-level">{{ sk.level }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Full-width band under the columns, so the page has a foot instead of
         ending in dead space. -->
    <div class="profile-lower">
      <div class="sw-panel news-panel">
        <h2 class="news-heading">Latest News</h2>

        <div v-if="news.length" class="news-list">
          <article v-for="post in news" :key="post.id" class="news-post">
            <h3 class="news-title">{{ post.title }}</h3>
            <div class="news-meta">
              <span class="news-date">
                <i class="fa-regular fa-calendar" /> {{ formatDate(post.publishedAt) }}
              </span>
              <span class="news-tag">{{ post.category }}</span>
            </div>
            <img v-if="post.imageUrl" class="news-image" :src="post.imageUrl"
                 :alt="post.title" @error="onImageError" />
            <p v-for="(para, i) in paragraphs(post.body)" :key="i" class="news-body">
              {{ para }}
            </p>
          </article>
        </div>

        <div v-else class="news-empty">
          <i class="fa-regular fa-newspaper" />
          <p>No announcements yet.</p>
          <span>Updates and event news will appear here.</span>
        </div>
      </div>
    </div>

    <snackBar :snackbar.sync="snackbar" />
    <vdialog
      :visible="showDialog"
      :content="panel"
      @close="showDialog = false"
    />
  </div>
</template>
<script>
import { useUserStore } from '@stores/user.js';
import { useAuthStore } from '@stores/auth.js';
import { useProfileStore } from '@stores/profile.js';
import { useGameStore } from '@stores/game.js';
import snackBar from '@components/utils/snackBar.vue';
import vdialog from '@components/utils/dialogFlash.vue';
import aviLayout from '@components/profile/aviLayout.vue';
import spacesLayout from '@components/profile/spacesLayout.vue';
import { WebSocketService } from '@/services/websocket';
import { useMeta } from 'vue-meta';
import deleteAllCookies from 'delete-all-cookies';

export default {
  name: 'ProfileComponent',
  components: {
    snackBar,
    vdialog,
    aviLayout,
    spacesLayout,
  },
  setup () {
    useMeta({ title: 'Profile' });
    document.cookie.split(";").forEach(function(c) { document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); });
  },

  data() {
    return {
      user: useUserStore(),
      auth: useAuthStore(),
      game: useGameStore(),
      spaces: [],
      tab: 'mySpaces',
      onlineAvi: null,
      mySpaces: [],
      favs: [],
      featured: [],
      popular: [],
      mySpacesActive: true,
      favsActive: false,
      featuredActive: false,
      popularActive: false,
      initialSpaceLoad: true,
      rightActive: true,
      leftActive: true,
      nextArr: [],
      prevArr: [],
      spaceArr: [],
      msg: '',

      snackbar: {
        visible: false,
        text: '',
        color: '',
        icon: '',
        timeout: 0,
        variant: 'tonal',
      },
      showDialog: false,
      panel: {
        url: '',
        width: 0,
        height: 0,
        contentHeight: '',
        contentWidth: '',
        hideClose: false,
        flash: '',
        flashvars: '',
        panelName: '',
        key: 0,
      },
      currentPage: 0,

      clock: '',
      clockTimer: null,
      news: [],
      // Shortcuts shown as the three cover tiles. `name`, `width` and
      // `height` are what triggerDialog() below already expects.
      // `width`/`height` are the SWF's declared stage (both movies say
      // 500x375) - the <object> must stay that size or Flash rescales the art.
      // `content*` is the rectangle the movie actually DRAWS into, anchored at
      // the stage origin, so the dialog can clip away the empty grey remainder.
      // Measured off the panel background shapes in the SWFs themselves:
      // home_panel_spin.swf WidgetBackground = 438x280, home_panel_pet.swf
      // PanelBackground = 218x280 (both rounded rects at 0,0).
      actionBoxes: [
        {
          name: 'spinToWinPanelSwf',
          label: 'Spin to Win',
          status: 'Spin now!',
          img: '/widget_spin.png',
          width: '500px',
          height: '375px',
          contentWidth: '438px',
          contentHeight: '280px',
        },
        {
          name: 'PetPanelSwf',
          // This movie draws its own close button, so suppress the overlay one.
          hideClose: true,
          label: 'Your Pets',
          status: 'Your pet needs attention.',
          img: '/widget_pets.png',
          width: '500px',
          height: '375px',
          contentWidth: '218px',
          contentHeight: '280px',
        },
        {
          name: 'PlantPanelSwf',
          label: 'Your Plants',
          status: 'You currently have no plants.',
          img: '/widget_plants.png',
          width: '500px',
          height: '375px',
          // home_panel_plant.swf exists nowhere we can reach - MiniWorlds
          // serves a 0-byte file for it. Flagged so the tile says so rather
          // than opening an empty dialog.
          unavailable: true,
        },
      ],
    };
  },

  computed: {
    firstName() {
      return this.user.defaultAvatar?.firstName || 'traveller';
    },
    onlineUsers() {
      return useProfileStore().onlineUsers || 0;
    },
    primaryLevel() {
      return this.user.defaultAvatar?.avatarXPs?.primary?.level ?? 0;
    },

    /**
     * The seven trainable skills, read from the avatar's XP rows. The cap per
     * skill differs (farming stops at 300, crafting at 200, the rest at 499),
     * so the bar is scaled against each skill's own ceiling rather than a
     * single shared maximum.
     */
    skills() {
      const xp = this.user.defaultAvatar?.avatarXPs || {};
      const defs = [
        { key: 'artist',   label: 'Artist',   cap: 499, color: '#e35d9a' },
        { key: 'explorer', label: 'Explorer', cap: 499, color: '#32c0c9' },
        { key: 'gamer',    label: 'Gamer',    cap: 499, color: '#f3b53a' },
        { key: 'social',   label: 'Social',   cap: 499, color: '#fb5cb6' },
        { key: 'arena',    label: 'Arena',    cap: 499, color: '#d9534f' },
        { key: 'farmer',   label: 'Farmer',   cap: 300, color: '#47a403' },
        { key: 'crafter',  label: 'Crafter',  cap: 200, color: '#8f6bd6' },
      ];
      return defs.map((d) => {
        const level = xp[d.key]?.level ?? 0;
        return {
          ...d,
          level,
          pct: Math.max(0, Math.min(100, Math.round((level / d.cap) * 100))),
          icon: `/img/skills/skill_${d.key === 'crafter' ? 'crafter' : d.key}.png`,
        };
      });
    },

    /** Their layout lays the skills out four to a row. */
    skillRows() {
      const out = [];
      for (let i = 0; i < this.skills.length; i += 4) {
        out.push(this.skills.slice(i, i + 4));
      }
      return out;
    },

    // No home-space field exists on the avatar, so "Enter World" goes to the
    // first space the user owns. Disabled when they own none.
    homeSpaceId() {
      const owned = Array.isArray(this.mySpaces) ? this.mySpaces.flat() : [];
      return owned.length ? owned[0]?.id ?? owned[0]?.spaceId ?? null : null;
    },
  },
  methods: {
    
    /**
     * Base URL for the home panels.
     *
     * game.webassetsPath is cached in GAME_INFO at login, so a server-side
     * correction does not reach an already-signed-in client - which is why the
     * panels kept requesting /homepage/... after the path was fixed. Trust the
     * cached value only if it actually points at the webassets root.
     */
    panelBase() {
      const p = this.game.webassetsPath || '';
      if (p.includes('/webassets/')) return p;
      return `${window.location.protocol}//${window.location.hostname}:8000/webassets/`;
    },

    triggerDialog(data) {
      if (data.unavailable) {
        this.triggerSnackbar({
          text: `${data.label} is not available yet.`,
          color: 'blue-grey',
          icon: 'mdi-information',
          timeout: 2600,
        });
        return;
      }
      // Build the panel fully BEFORE showing the dialog. Opening first meant
      // the <object> mounted with data=undefined and Flash initialised on an
      // empty movie; assigning the URL afterwards does not make the plugin
      // reload, which is the white box.
      this.panel.panelName = data.name;
      this.panel.width = data.width;
      this.panel.height = data.height;
      this.panel.contentHeight = data.contentHeight || data.height;
      this.panel.contentWidth = data.contentWidth || data.width;
      this.panel.hideClose = !!data.hideClose;
      if (data.name === 'spinToWinPanelSwf')
      {
        this.panel.flash = this.panelBase() + 'homepage/home_panel_spin.swf';
        this.panel.flashvars = 'avatarImagesPath=' + this.game.avatarImagesPath +'&webServiceUrl=' + this.game.webServiceUrl + '&contentUrl=' + this.game.contentUrl;
      }
      else if (data.name === 'PetPanelSwf')
      {
        this.panel.flash = this.panelBase() + 'homepage/home_panel_pet.swf';
        this.panel.flashvars = 'avatarImagesPath=' + this.game.avatarImagesPath +'&wwwRoot='+ this.game.wwwRoot+'&avatarId='+ this.user.defaultAvatar.id +'&wid=1&ownerId='+this.user.defaultAvatar.id +'&webServiceUrl=' + this.game.webServiceUrl + '&contentUrl=' + this.game.contentUrl;
      }
      else if (data.name === 'PlantPanelSwf')
      {
        this.panel.flash = this.panelBase() + 'homepage/home_panel_plant.swf';
        this.panel.flashvars = 'config=' + this.game.config +'&avatarId='+ this.user.defaultAvatar.id;
      }

      // Bump the key so the <object> is torn down and recreated rather than
      // reused with a new data attribute - Flash will not swap movies in place.
      this.panel.key = (this.panel.key || 0) + 1;
      this.$nextTick(() => { this.showDialog = true; });
    },
    triggerSnackbar(data) {
      const defaultData = {
        visible: true,
        text: '',
        color: '',
        icon: '',
        timeout: 2000,
        variant: 'tonal',
        offset: 0,
      };

      this.snackbar = { ...defaultData, ...data };
      setTimeout(() => {
        this.snackbar.visible = false;
      }, this.snackbar.timeout);
    },
    updateDuration(data) {
      this.durationData = data;
    },

  
    navigateToSpace(spaceId) {
      this.$router.push({ name: 'space', params: { id: spaceId } });
    },

    enterWorld() {
      if (this.homeSpaceId) this.navigateToSpace(this.homeSpaceId);
    },

    async loadNews() {
      try {
        const res = await fetch('/api/news');
        const data = await res.json();
        this.news = Array.isArray(data.posts) ? data.posts : [];
      } catch (e) {
        // A news outage should never take the profile down with it.
        console.error('could not load news:', e);
        this.news = [];
      }
    },

    // Bodies arrive as plain text with blank-line paragraph breaks.
    paragraphs(body) {
      return String(body || '')
        .split(new RegExp('\\n\\s*\\n'))
        .map((p) => p.trim())
        .filter(Boolean);
    },

    formatDate(iso) {
      if (!iso) return '';
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return '';
      return d.toLocaleDateString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric',
      });
    },

    onImageError(e) {
      // News art is optional and may not have been uploaded yet.
      e.target.style.display = 'none';
    },

    tickClock() {
      const d = new Date();
      this.clock = d.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    },

    changeTab(tab) {
      this.msg = '';
      if (this.tab !== tab && tab != 'pop') this.getSpaces(tab);
      if (tab === 'pop') this.getPop(tab);
      this.tab = tab;
      // remove v-btn--active from all buttons
      if (tab === 'mySpaces') {
        this.mySpacesActive = true;
        this.favsActive = false;
        this.featuredActive = false;
        this.popularActive = false;
      } else if (tab === 'favs') {
        this.mySpacesActive = false;
        this.favsActive = true;
        this.featuredActive = false;
        this.popularActive = false;
      } else if (tab === 'featured') {
        this.mySpacesActive = false;
        this.favsActive = false;
        this.featuredActive = true;
        this.popularActive = false;
      } else if (tab === 'pop') {
        this.mySpacesActive = false;
        this.favsActive = false;
        this.featuredActive = false;
        this.popularActive = true;
      }
    },

    nextSpace() {
      if (this.currentPage + 1 < this.spaceArr.length) {
        this.prevArr = this.spaces;
        this.spaces = this.nextArr;
        this.currentPage++;
        this.nextArr = this.spaceArr[this.currentPage + 1];
        this.leftActive = false;
        this.rightActive = this.currentPage + 1 >= this.spaceArr.length;
      }
    },
    prevSpace() {
      if (this.currentPage > 0) {
        this.nextArr = this.spaces;
        this.spaces = this.prevArr;
        this.currentPage--;
        this.prevArr = this.spaceArr[this.currentPage - 1];
        this.rightActive = false;
        this.leftActive = this.currentPage <= 0;
      }
    },
    async getPop(tab)
    {
      // check if anyone is online from the profile store
      if (useProfileStore().onlineUsers < 1) {
        // show offline message
        this.msg = 'No one is online :(';
        this.spaces = [];
        this.spaceArr = [];
      }
      else 
      {
        const res = await fetch('/api/spaces/popular', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // Authorization: 'Bearer ' + this.auth.$state.token,
            SWSID: this.auth.$state.session.SWSID,
          },
        });
        const data = await res.json();
        // if data is empty array
        if (data.popular.length < 1) {
          this.msg = 'No one is online :(';
          this.spaces = [];
          this.spaceArr = [];
          // set store to 0 and update OnlineHeader.numOnline
          useProfileStore().onlineUsers = 0;
          
          return;
        }
        this.popular = data.popular;
        
        if (tab === 'pop') {
          this.spaces = [];
          this.spaceArr = [];
          this.spaces = this.popular;
          this.spaceArr = this.popular;
          if (this.spaces.length > 1) {
            this.rightActive = false;
            this.nextArr = this.spaces[1];
          } else {
            this.nextArr = [];
            this.rightActive = true;
          }
          this.leftActive = true;
          this.spaces = this.spaces[0];
          this.prevArr = this.spaces[0];
        }
    }
    },
    async getSpaces(tab) {
      if (this.initialSpaceLoad) {
        this.initialSpaceLoad = false;
        const res = await fetch('/api/spaces/me', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // Authorization: 'Bearer ' + this.auth.$state.token,
            SWSID: this.auth.$state.session.SWSID,
          },
        });
        const data = await res.json();
        // check for 401 
        if (data.message === 'Unauthorized') {
          // logout
          this.auth.logout();
        }
        this.mySpaces = data.mySpaces;
        this.spaces = this.mySpaces;
        this.myFavs = data.myFavs;
        this.featured = data.featured;

        // return;
      }
      if (tab === 'mySpaces') {
        this.spaces = [];
        this.spaceArr = [];
        this.spaces = this.mySpaces;
        this.spaceArr = this.mySpaces;

        // set pages
        // spaces is a 2d array
        if (this.spaces.length > 1) {
          this.rightActive = false;
          this.nextArr = this.spaces[1];
        } else {
          this.nextArr = [];
          this.rightActive = true;
        }
        this.leftActive = true;
        // set array at index 0
        this.spaces = this.spaces[0];
        this.prevArr = this.spaces[0];
      } else if (tab === 'favs') {
        this.spaces = [];
        this.spaceArr = [];
        this.spaces = this.myFavs;
        this.spaceArr = this.myFavs;

        if (this.spaces.length > 1) {
          this.rightActive = false;
          this.nextArr = this.spaces[1];
        } else {
          this.nextArr = [];
          this.rightActive = true;
        }
        // set array at index 0
        this.leftActive = true;
        if (this.spaces.length < 1) {
          this.msg = 'No favorites added yet!';
          this.spaces = [];
          this.spaceArr = [];
          return;
        }
        this.spaces = this.spaces[0];
        this.prevArr = this.spaces[0];
      } else if (tab === 'featured') {
        // get featured
        this.spaces = [];
        this.spaceArr = [];
        this.spaces = this.featured;
        this.spaceArr = this.featured;
        if (this.spaces.length > 1) {
          this.rightActive = false;
          this.nextArr = this.spaces[1];
        } else {
          this.nextArr = [];
          this.rightActive = true;
        }
        // set array at index 0
        this.currentPage = 0;
        this.leftActive = true;
        this.spaces = this.spaces[0];
        this.prevArr = this.spaces[0];
      }
    },
  },

  mounted() {
    // removes all cookies; this clogs the websocket and cookies are only needed when logging in or registering
    // use npm i delete-all-cookies
    deleteAllCookies();

    this.tickClock();
    this.clockTimer = setInterval(this.tickClock, 1000);
    this.loadNews();

    // set rpc
    this.getSpaces(this.tab);
    window.rpc.setRPC({
      details: 'Profile',
      state: (this.user.defaultAvatar?.firstName || 'Unknown') + ' ' + (this.user.defaultAvatar?.lastName || 'User'),
      largeImageKey: 'logo',
      largeImageText: 'SmallWorlds',
      party: {
        id: this.auth.session.swsid,
        // set size to 1 of how many avatars the user owns
        size: [1, this.user.activeAvatars.length],
      },
      startTimestamp: Date.now(),
    });
},

  unmounted() {
    if (this.clockTimer) clearInterval(this.clockTimer);
  },
};
</script>

<style scoped>
.profile-container {
  display: flex;
  justify-content: center;
  align-items: stretch;
  gap: 20px;
  margin: 28px auto 0 auto;
  padding: 0 28px 40px 28px;
  /* Scale with the window rather than sitting in a 1020px island on a
     1920px screen, which is what made the page look tiny. */
  max-width: 1720px;
  width: 100%;
}

.column-main {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.column-avatar {
  width: 340px;
  flex-shrink: 0;
}

.profile-info {
  display: flex;
  flex-direction: column;
}

.sw-clock {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  background: var(--sw-slate);
  border: 1px solid var(--sw-steel);
  border-radius: 100px;
  padding: 4px 12px;
}

.sw-clock i {
  color: var(--sw-sky);
  font-size: 12px;
}

.clock-time {
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Consolas', 'Monaco', monospace;
  letter-spacing: 1px;
}

.welcome-message {
  font-size: 25pt;
  color: var(--sw-navy);
  margin-bottom: 20px;
  font-weight: bold;
  text-align: left;
  font-family: var(--sw-font);
}

.action-boxes {
  display: flex;
  gap: 22px;
  margin-bottom: 5px;
}

.action-box {
  position: relative;
  flex: 1;
  height: 170px;
  background-color: #7c7c7c;
  border-radius: 8px;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.action-box:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
}

.action-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.action-box.is-unavailable {
  filter: grayscale(0.75);
}

.action-box.is-unavailable img {
  opacity: 0.55;
}

.action-soon {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(30, 48, 77, 0.88);
  color: #fff;
  font-size: 11px;
  font-weight: bold;
  padding: 3px 12px;
  border-radius: 100px;
  white-space: nowrap;
}

.action-labels {
  display: flex;
  gap: 20px;
}

.action-label {
  flex: 1;
  font-size: 15px;
  color: #858585;
  text-align: center;
  font-weight: 500;
}

.destination-section {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid var(--sw-border-soft);
}

.enter-world-btn {
  width: 320px;
  height: 45px;
  font-size: 20px;
  margin: 20px auto 0 auto;
  display: block;
}

.column-avatar {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Skills panel, ported from SmallVerse's addon-container: a ring per skill
   drawn with conic-gradient, the icon sitting in the middle. */
.addon-container {
  background-color: #ffffff;
  border-radius: 5px;
  border: 1px solid #cfcfcf;
  position: relative;
}

.skills-header {
  padding: 10px 20px;
  border-bottom: 1px solid #d3d3d3;
  color: #1e304d;
  font-weight: bold;
  font-size: 16px;
}

.addon-content {
  padding: 16px 14px 18px 14px;
}

.skills-progress {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skills-row {
  display: flex;
  justify-content: flex-start;
}

.skill-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 25%;
}

.skill-circle {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: conic-gradient(var(--skill-color) calc(var(--percent) * 1%), #e0e0e0 0%);
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 5px;
  position: relative;
}

.skill-circle::before {
  content: '';
  position: absolute;
  width: 40px;
  height: 40px;
  background-color: white;
  border-radius: 50%;
}

.skill-img {
  width: 26px;
  height: 26px;
  object-fit: contain;
  position: relative;
  z-index: 1;
}

.skill-name {
  font-size: 11px;
  color: #5a6a80;
  text-align: center;
}

.skill-level {
  font-size: 12px;
  font-weight: bold;
  color: #1e304d;
}

/* ---- lower band ---- */

.profile-lower {
  max-width: 1720px;
  width: 100%;
  margin: 0 auto;
  padding: 0 28px 40px 28px;
}

.news-panel {
  min-height: 220px;
  padding-top: 24px;
}

/* Their news block is a centred heading over a stack of posts, not a
   navy-headed panel like the others. */
.news-heading {
  font-family: var(--sw-font);
  font-size: 26pt;
  font-weight: bold;
  color: var(--sw-navy);
  text-align: center;
  margin: 0 0 22px 0;
}

.news-list {
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-height: 620px;
  overflow-y: auto;
  padding-right: 6px;
}

.news-list::-webkit-scrollbar { width: 6px; display: block; }
.news-list::-webkit-scrollbar-track { background: #f0f0f0; border-radius: 3px; }
.news-list::-webkit-scrollbar-thumb { background: #c0c0c0; border-radius: 3px; }
.news-list::-webkit-scrollbar-thumb:hover { background: var(--sw-navy); }

.news-post {
  border: 1px solid #e2e6ec;
  border-radius: 8px;
  padding: 18px 20px 20px 20px;
  background: #fcfdff;
}

.news-title {
  font-family: var(--sw-font);
  font-size: 19px;
  color: var(--sw-navy);
  margin: 0 0 8px 0;
}

.news-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.news-date {
  font-size: 12px;
  color: #7a8798;
  display: flex;
  align-items: center;
  gap: 5px;
}

.news-tag {
  background: var(--sw-green);
  color: #fff;
  font-size: 11px;
  font-weight: bold;
  padding: 3px 11px;
  border-radius: 100px;
}

.news-image {
  width: 100%;
  max-height: 260px;
  object-fit: cover;
  border-radius: 6px;
  margin-bottom: 12px;
  display: block;
}

.news-body {
  font-size: 14px;
  line-height: 1.55;
  color: #44505f;
  margin: 0 0 10px 0;
}

.news-body:last-child { margin-bottom: 0; }

.news-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 34px 0;
  color: #8a94a6;
}

.news-empty i {
  font-size: 34px;
  color: #b9c5d6;
  margin-bottom: 4px;
}

.news-empty p {
  margin: 0;
  font-size: 16px;
  font-weight: bold;
  color: #5a6a80;
}

.news-empty span {
  font-size: 13px;
}

@media only screen and (max-width: 1080px) {
  .profile-container {
    flex-direction: column;
    align-items: center;
  }
}
</style>
