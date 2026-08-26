<template>
    <v-dialog v-model="dialog" :width="content.contentWidth || content.width" persistent>
    <v-card
      class="flash-card"
      :width="content.contentWidth || content.width"
      :height="content.contentHeight || content.height"
      v-click-outside="onClickOutside"
    >
      <!-- aria-label, not title: a `title` makes Chromium raise a native Win32
           tooltip, and clicking this button unmounts it in the same tick, so the
           tooltip never gets a mouse-leave and is orphaned on screen - the stray
           "Close" box that floats over the app until it is restarted. -->
      <button
        v-if="!content.hideClose"
        class="flash-close"
        aria-label="Close"
        @click="$emit('close')"
      >
        <i class="fa-solid fa-xmark" />
      </button>
    <object :key="content.key" class="gameFrame" :height="content.height" :width="content.width" type="application/x-shockwave-flash" :data="content.flash" v-if="content.flash" :id="content.panelName" :name="content.panelName">
      <param name="menu" value="false">
      <param name="quality" value="high">
      <param name="movie" :value="content.flash">
      <param name="bgcolor" value="#e1e1e1">
      <param name="flashvars" :value="content.flashvars">
      <param name="allowScriptAccess" value="always">
      <param name="allowFullScreen" value="true">
      <param name="wmode" value="window">
    </object>
  </v-card>
</v-dialog>
  </template>
  
  <script>
  import { defineComponent, watch } from 'vue';
  import router from '@/router';
  import { useAuthStore} from '@/stores/auth.js';
  import { useGameStore } from '@/stores/game.js';
  const auth = useAuthStore();
  const game = useGameStore();

  export default defineComponent({
    name: 'dialogFlash',
    props: {
      visible: {
      type: Boolean,
      required: true,
      default: false,
    },
    content: {
      type: Object,
      required: true,
      default: () => ({
        width: 800,
        height: 600,
        panelName: '',
      }),
    },
    },
    methods: {
    onClickOutside() {
      //close dialog
      this.$emit('close');
      // this.$refs.iframe.src = '';
    },
  },
  computed: {
    dialog: {
      get() {
        return this.visible;
      },
      set(value) {
        if (!value) {
          this.$emit('close');
        }
      },
    },
  },
    setup() {
      watch(auth, () => {
        // NB: the store property is `isLoggedIn`. Checking `auth.loggedIn` read
        // undefined, so this fired a redirect to /login on EVERY auth store
        // mutation — including the initialize() the router guard runs on each
        // navigation — which aborted any in-flight navigation (e.g. entering a space).
        if (!auth.isLoggedIn) {
          router.push({ name: 'login' });
        }
      });
      return {
        auth,
        game,
      };
    },
  });
  </script>

<style>
.v-overlay__content {
  align-items: center;
}

/* Size the card to the movie exactly - any padding or rounding shows up as a
   grey border around the stage. */
.flash-card {
  padding: 0 !important;
  /* Clip the movie's unused stage area rather than showing it as a grey slab. */
  overflow: hidden;
  border-radius: 6px;
  position: relative;
  background: #000 !important;
}

.flash-card .gameFrame {
  display: block;
}

.flash-close {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 5;
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 50%;
  background: rgba(20, 36, 63, 0.78);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
}

.flash-close:hover {
  background: #d9534f;
}
</style>