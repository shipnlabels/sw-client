import { defineStore } from 'pinia';
import { reactive } from 'vue';

export const useGameStore = defineStore({
  id: 'game',
  options: {
    // If you want to disable the auto-injection of this store in a component
    // This is useful if you want to use this store inside another store
    // without injecting it by default in a component
    // inject: []
  },
  state: () => {
    const initialState = reactive({
      webServiceUrl: null,
      contentUrl: null,
      configUrl: null,
      avatarImagesPath: null,
      wwwRoot: null,
      webassetsPath: null,
      config: null,
    });
    window.storage.getItem('GAME_INFO').then((value) => {
      if (value) {
        const storedGameInfo = JSON.parse(value);
        for (const key in storedGameInfo) {
          initialState[key] = storedGameInfo[key];
        }
      }
    });
  
    return initialState;
  },
    actions: {
    updateState(data) {
      const newGameInfo = { ...this.$state, ...data };

      // Apply to the store first, and synchronously. This used to write to
      // storage and then call $reset(), which threw the new values away: $reset
      // re-runs state(), and state() only fills itself in from an asynchronous
      // storage read that has not resolved yet. So every field stayed null
      // right after storeInfo() - and Profile.vue builds the avatar panel's
      // flashvars from these, so the panel was handed avatarImagesPath=null and
      // fell back to the default NPC instead of the player's own avatar.
      this.$patch(newGameInfo);

      window.storage.removeItem('GAME_INFO');
      window.storage.setItem('GAME_INFO', JSON.stringify(newGameInfo));
    },
    async storeInfo(data) {
      this.updateState(
        {
          webServiceUrl: data.webServiceUrl,
          contentUrl: data.contentUrl,
          configUrl: data.configUrl,
          avatarImagesPath: data.avatarImagesPath,
          wwwRoot: data.wwwRoot,
          webassetsPath: data.webassetsPath,
          config: data.config,
        }
      );
    },
      
  },
});