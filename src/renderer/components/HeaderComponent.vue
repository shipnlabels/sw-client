<script setup>
import { computed, watch, onMounted, onUnmounted, ref } from 'vue';
import { useAuthStore } from '@/stores/auth.js';
import { useUserStore } from '@/stores/user.js';
import { useActiveMeta, useMeta } from 'vue-meta';
import { WebSocketService } from '@/services/websocket';
import { useRoute, useRouter } from 'vue-router';


const auth = useAuthStore();
const user = useUserStore();
const spaceName = ref('');
const route = useRoute();
const router = useRouter();

// const headerActive = computed(() => user.defaultAvatar.header);
// const experActive = computed(() => user.defaultAvatar.experiment);
const metadata = computed(() => { return useActiveMeta() });
const windowTitle = computed(() => { return metadata.value?.title });

const xpPercentage = ref(0);

// Calculate initial value
const calculateXpPercentage = (userVal) => {
  if (!userVal?.defaultAvatar?.avatarXPs?.primary) return 0;
  if (userVal.defaultAvatar.avatarXPs.primary.xp === 0) return 0;
  
  return (userVal.defaultAvatar.avatarXPs.primary.levelXP / 
          userVal.defaultAvatar.avatarXPs.primary.xp) * 100;
};
xpPercentage.value = calculateXpPercentage(user);


watch(metadata, (newValue) => {
  // metadata was updated, update the title
  useMeta({ title: newValue });
});

watch(
  () => route.name,
  (newVal, oldVal) => {
    if (route.name == 'space') {
      WebSocketService.sendMessage({ action: 'getSpaceName' }, route.path);
    }
  }
);

// watch to see if user changes then recalcuate the xpPercentage
watch(user, (newVal) => {
  if (!newVal?.defaultAvatar?.avatarXPs?.primary) {
    xpPercentage.value = 0;
    return;
  }
  if (newVal.defaultAvatar.avatarXPs.primary.xp == 0) {
    xpPercentage.value = 0;
    return;
  }
  xpPercentage.value = newVal.defaultAvatar.avatarXPs.primary.levelXP / newVal.defaultAvatar.avatarXPs.primary.xp * 100;
  });


// watch on WebSocketService.message
watch(WebSocketService.message, (newVal) => {
  if (newVal.action == 'spaceNameResponse') {
    spaceName.value = newVal.spaceName;  
  }
});

// watch for spaceName changes

const isLoggedIn = computed(() => auth.isLoggedIn);
const hasPet = computed(() => !!user.defaultAvatar?.takePet);
const hasHeader = computed(() => !!user.defaultAvatar?.header);
const hasExperiment = computed(() => !!user.defaultAvatar?.experiment);
const isAdmin = computed(() => {
  return (
    auth.primaryGroupId == 1 ||
    auth.primaryGroupId == 2 ||
    auth.primaryGroupId == 13 ||
    auth.secondaryGroupIds.includes(13)
  );
});
const hasWebsiteControl = computed(() => auth.secondaryGroupIds.includes(17));
const hasInviteControl = computed(() => auth.secondaryGroupIds.includes(22));
const isSuperAdmin = computed(() => auth.primaryGroupId == 1);

// Modify onopen to handle queued messages

onMounted(() => {
  if (auth.isLoggedIn) {
    WebSocketService.connect(auth.session.SWSID);
    // WebSocketService.sendMessage('Hello World');
    // sendMessage('Hello, world!');

  }
});

onUnmounted(() => {
  if (WebSocketService.ws?.value) {
    WebSocketService.ws.value.close();
  }
});


</script>
<template>
  <div v-if="auth.isLoggedIn">
  <v-navigation-drawer v-model="drawer" temporary class="swDrawer">
    <profileHeader 
    v-if="($route.name === 'profile') || ($route.name === 'home') 
    || ($route.name === 'not-found')"
    :user="user" :petActive="hasPet" :headerActive="hasHeader" :experActive="hasExperiment"
    :isAdmin="isAdmin" :isSuperAdmin="isSuperAdmin"
    :hasInviteControl="hasInviteControl" :hasWebsiteControl="hasWebsiteControl" :hasRemember="hasRemember" @triggerDialog="triggerDialog" 
    @switchToggle="switchToggle" @smi="smi" @getCurrentRoutes="getCurrentRoutes"
    @appPath="appPath" @fixItems="fixItems" @upload="upload" @invite="invite" @configStr="configStr" @addItems="addItems" @allItems="allItems" @missingItems="missingItems"
    />
    <inworldHeader v-if="($route.name === 'space')"
    :user="user" :petActive="hasPet" :headerActive="hasHeader" :experActive="hasExperiment"
    :isAdmin="isAdmin" :isSuperAdmin="isSuperAdmin" :hasInviteControl="hasInviteControl" :hasWebsiteControl="hasWebsiteControl" 
    :hasRemember="hasRemember" @triggerRDialog="triggerRDialog" @triggerDialog="triggerDialog"
    @switchToggle="switchToggle" @smi="smi" @getCurrentRoutes="getCurrentRoutes"
    @appPath="appPath" @fixItems="fixItems" @upload="upload" @invite="invite" @configStr="configStr" @addItems="addItems" @allItems="allItems" @missingItems="missingItems"
    />
    <smiHeader 
    v-else-if="$route.path === '/smi'"
    :user="user"
    @getCurrentRoutes="getCurrentRoutes"
    />
    <template v-slot:append v-if="$route.name !== 'smi' && isLoggedIn">
      <div class="pa-2">
        <v-tooltip v-model="show" location="top">
          <template v-slot:activator="{ props }">
            <v-icon-btn icon="mdi-content-copy" class="swIBtn" @click="copyURL" v-bind:="props" variant="outlined"></v-icon-btn>
          </template>
          <span ref="tool">Copy Current URL</span>
        </v-tooltip>

        <v-tooltip v-model="show_s" location="top">
          <template v-slot:activator="{ props }">
            <v-icon-btn icon="mdi-account-cog" class="float-right swIBtn"  @click="gotoSettings" v-bind:="props" variant="outlined"></v-icon-btn>
          </template>
          <span ref="settings">Settings</span>
        </v-tooltip>

        <v-tooltip v-model="show_f" location="top" v-if="hasRemember">
          <template v-slot:activator="{ props }">
            <v-btn icon v-bind="props">
              <v-icon color="info" @click="forget"> mdi-account-switch </v-icon>
            </v-btn>
          </template>
          <span ref="forgot">Forget this account & logout</span>
        </v-tooltip>
      </div>

      <div class="pa-2">
        <v-btn block color="red" @click="logout"> 
          <v-icon> mdi-logout </v-icon>
          Logout </v-btn>
      </div>
    </template>
  </v-navigation-drawer>

  </div>

  <div class="titlebar">
  <v-app-bar
    flat
    height="36"
    class="topbar-mac"
    style="-webkit-app-region: drag"
  >
    <div class="d-flex align-center window-controls" v-if="os === 'macOS'">
      <v-btn
        icon
        small
        class="window-btn close-btn mr-1"
        @click="close"
        style="-webkit-app-region: no-drag"
      >
        <v-icon size="9">mdi-close</v-icon>
      </v-btn>
      
      <v-btn
        icon
        small
        class="window-btn minimize-btn mr-1"
        @click="minWindow"
        style="-webkit-app-region: no-drag"
      >
        <v-icon size="12">mdi-minus</v-icon>
      </v-btn>
      
      <v-btn
      
        icon
        small
        class="window-btn maximize-btn"
        @click="maxWindow"
        style="-webkit-app-region: no-drag"
      >
      <v-icon size="12">
       <!-- svg of macOS maximize button -->
       <svg 
    fill="none" 
    height="15" 
    viewBox="0 0 12 12" 
    width="15" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M5 7l-1-1l1-1 M7 5l1 1l-1 1" 
      stroke="currentColor" 
      stroke-linecap="round" 
      stroke-linejoin="round" 
      stroke-width="1.2"
      transform="rotate(45, 6, 6)"
    />
  </svg>
    </v-icon>      </v-btn>
    </div>

    <!-- Windows -->
    <div class="d-flex align-center window-controls-win" v-else-if="os === 'Windows'">
      <v-btn
      icon
      small
      class="win-btn minimize-win"
      @click="minWindow"
      style="-webkit-app-region: no-drag"
    >
      <v-icon>mdi-minus</v-icon>
    </v-btn>
    
    <v-btn
      icon
      small
      class="win-btn max-win"
      @click="maxWindow"
      style="-webkit-app-region: no-drag"
    >
      <v-icon>mdi-checkbox-blank-outline</v-icon>
    </v-btn>
    
    <v-btn
      icon
      small
      class="win-btn close-win"
      @click="close"
      style="-webkit-app-region: no-drag"
    >
      <v-icon>mdi-close</v-icon>
    </v-btn>
    </div>

     
    <!-- Hamburger removed: navigation and sign-out now live in the main
             chrome bar, and the drawer's remaining entries were dead - the
             settings button pushed to a 'settings' route that does not exist. -->


 
<div class="title-container">
    <div class="window-title">
      {{ (spaceName.length > 0) ? spaceName + ' | SmallWorlds' : (windowTitle + ' | SmallWorlds') }}
    </div>        

    <v-btn icon @click="reload" class="reload-btn" style="-webkit-app-region: no-drag">
          <v-icon size="18">mdi-reload</v-icon>
        </v-btn>
        <!-- Add a tooltip to the reload button -->
      </div>
      <!-- Only display this if route.name == space -->

      <div class="stats-container" v-if="route.name == 'space'">
      <div class="primaryXP" style="-webkit-app-region: no-drag">
          <v-tooltip location="bottom" :close-on-content-click="false" :open-on-hover="true">
            <template v-slot:activator="{ props }">
                  <v-img src="/icon_primary.png" alt="Primary XP" width="31" height="31" class="xp-icon" v-bind="props" />
      <div class="level-progress" >
        <v-progress-linear
        v-bind="props"
          :model-value="xpPercentage"
          height="20"
          rounded
          bg-color="rgb(58, 200, 210)"
          color="rgb(87, 225, 240)"
          class="progress"
          
        >
          <template v-slot:default="{ value }">
            <div class="progress-content">
              <span class="level-text">{{ user.defaultAvatar?.avatarXPs?.primary?.level }}</span>
            </div>
          </template>
        </v-progress-linear>
      </div>
  </template>
  <div class="tooltip-content">
    You are Level {{ user.defaultAvatar?.avatarXPs?.primary?.level }} with <CommaValue :value="user.defaultAvatar?.avatarXPs?.primary?.levelXP" />xp
    <br />Next Level: <CommaValue :value="user.defaultAvatar?.avatarXPs?.primary?.xp" />xp
    <br/>
    (<CommaValue :value="(user.defaultAvatar?.avatarXPs?.primary?.xp - user.defaultAvatar?.avatarXPs?.primary?.levelXP)" />xp to go)
  </div>
</v-tooltip>
  </div>
    
      <!-- Currency Display -->
  <div class="currency-display" style="-webkit-app-region: no-drag">
    <v-tooltip location="bottom">
      <template v-slot:activator="{ props }">
        <div class="currency-item gold" v-bind="props">
          <v-img src="/balance_gold.png" alt="Gold" width="30" height="30" />
          <CommaValue :value="user.goldBalance" />
        </div>
      </template>
      <span>You have <CommaValue :value="user.goldBalance" /> gold.</span>
    </v-tooltip>

    <v-tooltip location="bottom">
      <template v-slot:activator="{ props }">
        <div class="currency-item tokens" v-bind="props">
          <v-img src="/balance_token.png" alt="Tokens" width="30" height="30" />
          <CommaValue :value="user.tokensBalance" />
        </div>
      </template>
      <span>You have <CommaValue :value="user.tokensBalance" /> tokens.</span>
    </v-tooltip>
  </div>
</div>
      <v-spacer></v-spacer>
      
  </v-app-bar></div>
  <aDialog 
    :visible="showRDialog"
    :content="panel"
    @close="showRDialog = false"
    @triggerRDialog="triggerRDialog"
  />
  <vdialog
    :visible="showDialog"
    :content="panel"
    @close="showDialog = false"
    @triggerDialog="triggerDialog"
  />

</template>

<script>
// import { useAuthStore } from '@stores/auth.js';
import router from '@/router';
import axios from 'axios';
import vdialog from '@components/utils/dialogFrame.vue';
import aDialog from '@components/utils/dialogAway.vue';
import profileHeader from '@components/profile/header/profileHeader.vue';
import smiHeader from '@components/profile/header/smiHeader.vue';
import inworldHeader from '@components/profile/header/inworldHeader.vue';
import CommaValue from './utils/commaValue.vue';



// import { useUserStore } from '@stores/user.js';

export default {

  name: 'headerComponent',

  components: {
    vdialog,
    profileHeader,
    smiHeader,
    inworldHeader,
    aDialog,
  },


  data() {
    return {
      user: useUserStore(),
      showDialog: false,
      showRDialog: false,
      hasRemember: false,
      baseUrl: import.meta.env.VITE_DEFAULT_URL,
      panel: {
        url: '',
        width: 0,
        height: 0,
        persistent: false,
        data: '',
      },
      drawer: false,
      show: false,
      show_f: false,
      show_s: false,
      petActive: false,
      headerActive: false,
      experActive: false,
      snackbar: {
        visible: false,
        text: '',
        color: '',
        icon: '',
        timeout: 3000,
        xpPercentage: 0,
      },
      // eslint-disable-next-line no-undef
      // url is the current url minus the base url
      url: window.location.href.replace(import.meta.env.VITE_DEFAULT_URL, ''),
      space: ' ',
      items: [
        { title: 'Home', icon: 'mdi-home-city' },
        { title: 'My Account', icon: 'mdi-account' },
        { title: 'Users', icon: 'mdi-account-group-outline' },
      ],
      rail: true,
      os: '',
      x: 'grey',
      min: 'grey',
      max: 'grey',
      closeColor: '#ff5f57',
      minColor: '#ffbd2e', 
      maxColor: '#28c940',
      title: 'SmallWorlds',
      windowTitle: 'SmallWorlds',
    };
  },

  methods: {
    triggerDialog(data) {
      this.showDialog = true;
      this.panel.url = data.url;
      this.panel.width = data.width;
      this.panel.height = data.height;
      this.panel.persistent = data.persistent;
    },
    triggerRDialog(data) {
      this.showRDialog = true;
      this.panel.url = data.url;
    },
    switchToggle(toggle, value) {
      this.callToggle(toggle, value);
    },

    async callToggle(toggle, model) {
      const user = useUserStore();
      try {
        if (toggle === 'updateTakePet') model ? this.petActive = false : this.petActive = true;
          if (toggle === 'header') model ? this.headerActive = false : this.headerActive = true;
          if (toggle === 'experiment') model ? this.experActive = false : this.experActive = true;
        axios.defaults.headers.common['swsid'] = useAuthStore().session.SWSID;
        const resp = await axios.post('/api/avatar/' + toggle, {
          id: user.defaultAvatar.id,
          enableExperi: this.experActive,
          enableHeader: this.headerActive,
          takePet: this.petActive,
        });
        if (resp.data.success) {
          // for instant update
          user.defaultAvatar.takePet = this.petActive;
          user.defaultAvatar.header = this.headerActive;
          user.defaultAvatar.experiment = this.experActive;
          // For reloading the page, save values
          window.storage.getItem('USER_INFO').then((uState) => {
            const user = JSON.parse(uState);
            user.defaultAvatar.takePet = this.petActive;
            user.defaultAvatar.header = this.headerActive;
            user.defaultAvatar.experiment = this.experActive;
            window.storage.setItem('USER_INFO', JSON.stringify(user));
          });
        } else {
          model ? (model = false) : (model = true);
          console.error('Error updating avatar:', resp);
        }

      
      } catch (error) {
        model ? (model = true) : (model = false);

        console.error('Error updating avatar:', error);
      }

    },
    smi() {
      window.app.custom(useAuthStore().session.SWSID, "/smi", 800, 750);
    },
    fixItems()
    {
      window.app.custom(useAuthStore().session.SWSID, "/fix/items", 800, 750);
    },
    upload() {
      window.app.custom(useAuthStore().session.SWSID, "/upload", 800, 750);
    },
    invite() {
      window.app.custom(useAuthStore().session.SWSID,"/add/invite", 500, 500);
    },
    configStr() {
      window.app.custom(useAuthStore().session.SWSID, "/conf",800, 750);
    },
    addItems() {
      window.app.custom(useAuthStore().session.SWSID,"/add/item/model", 800, 750);
    },
    allItems() {
      window.app.custom(useAuthStore().session.SWSID, "/all/items", 950, 750);
    },
    missingItems() {
      window.app.custom(useAuthStore().session.SWSID, "/missing/items", 950, 750);
    },
    appPath() {
      window.app.appPath();
    },
    gotoSettings() {
      this.$router.push({ name: 'settings' });
    },
    copyURL() {
      // copy url to clipboard
      navigator.clipboard.writeText(this.url);
      //call triggerSnackbar method in profile.vue
      //make tooltip appear and say copied
      // this.show = true;
      this.$refs.tool.innerText = 'Copied!';
      setTimeout(() => {
        this.$refs.tool.innerText = 'Copy Current URL';
      }, 3000);
    },
    getV() {
      console.log(this.version);
    },
    colorBtns() {
      // Colors remain constant for macOS style
    },
    resetBtns() {
      // Colors remain constant for macOS style
    },
    minimize() {
      window.api.minimize();
    },
    maximize() {
      window.api.maximize();
    },
    close() {
      window.api.close();
    },
    operatingSystem() {
      const platform = navigator.platform;
      if (platform.indexOf('Win') !== -1) return 'Windows';
      if (platform.indexOf('Mac') !== -1) return 'macOS';
      if (platform.indexOf('Linux') !== -1) return 'Linux';
      return 'Unknown';
    },
    commas(number) {
      return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },
    getCurrentRoutes() {
      if (router.currentRoute.value.path == '/') {
        return '/profile';
      }
      return router.currentRoute.value.path;
    },

    toggleDrawer() {this.drawer = !this.drawer;},
    // gotoUrl(url) {
    //   // block all urls outside of the app
    //   // add baseUrl to front of url
    //   url = this.baseUrl + url;
    //   if (!url.includes(import.meta.env.VITE_DEFAULT_URL) && !url.includes('localhost')) {
    //     alert('Please stay within the app.');
    //     return;
    //   }
    //   // always go to url
    //   window.location.href = url;
    //   this.reload();
    // },

    reload() {window.location.reload();},
    maxWindow() {window.app.maximize();},
    minWindow() {window.app.minimize();},
    close() {window.app.close();},
    logout() {
      const auth = useAuthStore();
      auth.logout();},
    // called from emit
    updateHeader(url) {this.url = url;},
    forget() {
      localStorage.removeItem('remember');
      window.app.forget();
      this.$refs.forgot.innerText = 'Account Forgotten, Redirecting...';
      setTimeout(() => {
        this.$refs.forgot.innerText = 'Forget this account & logout';
        this.logout();
      }, 2000);
    },
  },

  mounted() {
    this.os = this.operatingSystem();
    console.log(this.os);
    if (this.isLoggedIn) {
      // const user = useUserStore();
      this.user = useUserStore();
      this.petActive = this.user.defaultAvatar.takePet ? true : false;
      this.headerActive = this.user.defaultAvatar.header ? true : false;
      this.experActive = this.user.defaultAvatar.experiment
        ? true
        : false;
      this.hasRemember = JSON.parse(localStorage.getItem('remember')) ?? {value: true};
    }
    // get values from this.user object
    // output the userStore

  },


  watch: {
    group() {
      this.drawer = false;
    },

    // windowTitle 
    windowTitle() {
      this.windowTitle = this.metadata.title;
    },

    // $route(to) {
    //   this.url = window.location.href;
    //   // console.log(this.isLoggedIn);
     
    // },

    isLoggedIn() {
      const auth = useAuthStore();
      return auth.isLoggedIn;
    },

    hasPet() {
      this.petActive = this.user.$state.defaultAvatar.takePet;
    },
    hasHeader() {
      this.headerActive = this.user.$state.defaultAvatar.header;
    },
    hasExperiment() {
      this.experActive = this.user.$state.defaultAvatar.experiment;
    },

    // urlContainsBase() {
    //   if (!this.url.includes(import.meta.env.VITE_DEFAULT_URL)) {
    //     this.url = import.meta.env.VITE_DEFAULT_URL;
    //   } else {
    //   // visually remove base url from url
    //   this.url = window.location.href.replace(import.meta.env.VITE_DEFAULT_URL, '');
    //   }
    // },
  },

  emits: ['update:group'],
  computed: {
    windowTitle() {
      return this.metadata?.title || 'SmallWorlds';
    },



  },
  // watch metadata for changes of windowTitle

}
</script>
<style scoped>
.stats-container {
  display: flex;
  align-items: center;
  gap: 15px;
  right: 0;
  margin-right: 15%;
  position: absolute;
  
}

.progress-content {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

:v-deep .progress .v-progress-linear__determinate {
  background: linear-gradient(to right, rgb(87,225,240) 0%, rgb(58,200,210) 100%) !important;
}


.xp-icon {
  position: absolute;
  left: -3%;
  top: 52%;
  transform: translateY(-50%);
  z-index: 2;
}

.level-text {
  z-index: 1;
  color: white;
  font-size: 12px;
  font-weight: bold;
  text-shadow: 1px 1px 1px rgba(0,0,0,0.5);
}
.progress-hover {
  cursor: pointer;
}

.tooltip-content {
  padding: 4px 8px;
  font-size: 12px;
}
.primaryXP {

  margin: 0;
  margin-right:-15px;
  gap: 8px;
}

.level-progress {
  width: 100px;
  position: relative;

}

.level-text {
  position: absolute;
  width: 100%;
  text-align: center;
  color: white;
  font-size: 16px;
  font-weight: bold;
  text-shadow: 1.5px 1.5px 2px rgba(0,0,0,1);
  z-index: 1;
}
.currency-item.gold {
  color: rgb(253,230,176);
  text-shadow: 1.5px 1.5px 2px rgba(0,0,0,1);
  user-select: none;
}

.currency-item.tokens {
  color: rgb(232,168,134);
  text-shadow: 1.5px 1.5px 2px rgba(0,0,0,1);
  user-select: none;
}
.currency-display {
  display: flex;
  align-items: center;
  gap: 8px;
  /* margin-left: 16px;
  padding: 4px 8px;
  border-radius: 4px; */
}

.currency-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
}


.currency-item img {
  object-fit: contain;
}

.currency-item span {
  font-size: 16px;
  font-weight: 500;

}
.window-controls-win {
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
}



.win-btn {
  width: 46px !important;
  height: 100% !important;
  min-width: 46px !important;
  border-radius: 0;
  transition: background-color 0.1s ease;
  background-color: none !important;
  z-index: 5;
}

.win-btn .v-icon {
  color: #fff;
  font-size: 16px;
}

.win-btn:hover {
  background-color: rgba(0, 0, 0, 0.06);
}

.close-btn:hover {
  background-color: #e81123 !important;
}

.close-win:hover  {
  background-color: #e81123 !important;
}
.close-win:hover .v-icon {
  color: #fff !important;
}

.minimize-win:hover {
  background-color: #ffbd2e !important;
}

.max-win:hover {
  background-color: #00c853 !important;
}

.max-win:hover .v-icon {
  color: #fff !important;
}

.minimize-win:hover .v-icon {
  color: #fff !important;
}


.title-container {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
}
.reload-btn {
  margin-left: 4px;
}
.window-title {
  font-size: 13px;
  font-weight: 500;
  color: #fff;
  text-align: center;
  pointer-events: none;
  user-select: none;
  -webkit-app-region: drag;
}

.window-inactive .window-title {
  opacity: 0.6;
}

.topbar-mac {
  position: relative;
  display: flex;
  align-items: center;
}
.window-btn {
  width: 12px !important;
  height: 12px !important;
  min-width: 12px !important;
  transition: transform 0.2s ease;
}

.window-btn:hover {
  transform: scale(1.1);
}

.window-controls:hover .window-btn .v-icon {
  opacity: 1;
  font-weight: bold;
  transform: scale(1.2);
}


.window-btn .v-icon {
  transition: all 0.2s ease;
}

.menu-btn {
  font-size: 13px;
  font-weight: 500;
  text-transform: none;
  letter-spacing: 0;
}

.menu-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

.window-btn {
  width: 12px !important;
  height: 12px !important;
  min-width: 12px !important;
  border-radius: 50%;
}

.window-btn .v-icon {
  opacity: 0;
}

.window-btn:hover .v-icon {
  opacity: 0.5;
}

.topbar-mac {
  /* background: #0097c9 !important;
   */
   background: #578493 !important;
  /* border-bottom: 1px solid #e0e0e0; */
}

/* Window States */
.topbar-mac {
  /* background: rgba(236, 236, 236, 0.7) !important; */
  backdrop-filter: blur(10px);
  /* border-bottom: 1px solid #e0e0e0; */
}

.window-inactive .topbar-mac {
  background: rgba(236, 236, 236, 0.7) !important;
}

/* Traffic Light Buttons */
.window-btn {
  width: 12px !important;
  height: 12px !important;
  min-width: 12px !important;
  margin: 0 4px;
  border-radius: 50% !important;
  transition: all 0.1s ease-in-out;
  position: relative;
}

/* Default States */
.close-btn {
  background-color: #ff5f57 ;
}

.minimize-btn {
  background-color: #febc2e ;
}

.maximize-btn {
  background-color: #28c941 ;
}

/* Inactive Window States */
.window-inactive .window-btn {
  background-color: #dcdcdc !important;
}

/* Hover Effects */
.window-btn:hover::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, .1);
}

.window-btn:active::after {
  background-color: rgba(0, 0, 0, 0.2);
}

/* Icon Visibility */
.window-btn .v-icon {
  opacity: 0;
  transition: opacity 0.2s;
  color: rgba(0, 0, 0, 0.5);
}

.window-controls:hover .window-btn .v-icon {
  opacity: 1;
}

/* Inactive Window Icon States */
.window-inactive .window-btn .v-icon {
  opacity: 0 !important;
}

.window-controls {
  padding-left: 8px;
}

.window-btn {
  width: 12px !important;
  height: 12px !important;
  min-width: 12px !important;
  margin: 0 4px;
  border-radius: 50% !important;
}

.window-btn .v-icon {
  opacity: 0;
  transition: opacity 0.2s;
}



.window-controls:hover .window-btn .v-icon {
  opacity: 1;
}

.menu-btn {
  font-size: 13px;
  text-transform: none;
  letter-spacing: 0;
}

.menu-btn:hover {
  background: rgba(0, 0, 0, 1);
}
</style>
