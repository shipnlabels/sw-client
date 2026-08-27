import { defineStore } from 'pinia';
import axios from 'axios';
import { reactive } from 'vue';
import { useGameStore } from '@/stores/game.js';
import { useAuthStore } from '@/stores/auth.js';
export const useUserStore = defineStore({
  id: 'user',
  options: {
    // If you want to disable the auto-injection of this store in a component
    // If you want to disable the auto-injection of this store in a component
    // This is useful if you want to use this store inside another store
    // without injecting it by default in a component
    // inject: []
  },
  state: () => {
    const initialState = reactive({
      id: null,
      firstName: null,
      lastName: null,
      email: null,
      goldBalance: null,
      tokensBalance: null,
      sex: null,
      citizenLevel: null,
      // Staff rank. Display only - the AMF gateway enforces permissions
      // server-side, so nothing here is a security boundary.
      role: 'player',
      staffLevel: 0,
      contentPath: null,
      citizenTitle: null,
      citizenImageExt: null,
      defaultAvatar: null,
      loyalty: null,
      spaces: null,
      permissions: null,
      activeAvatars: [],
    });
    window.storage.getItem('USER_INFO').then((value) => {
      try {
        if (value && value !== 'undefined') {
          const storedUserInfo = JSON.parse(value);
          for (const key in storedUserInfo) {
            initialState[key] = storedUserInfo[key];
          }
        }
      } catch (e) {
        console.error('Failed to parse USER_INFO in state initialization:', e);
      }
    });

    return initialState;
  },
  actions: {
    async initialize() {
      window.storage.getItem('USER_INFO').then((value) => {
        try {
          if (value && value !== 'undefined') {
            const storedUserInfo = JSON.parse(value);
            for (const key in storedUserInfo) {
              this[key] = storedUserInfo[key];
            }
          }
        } catch (e) {
          console.error('Failed to parse USER_INFO in initialize:', e);
        }
      });
    },

    updateState(data) {
      const newUserInfo = { ...this.$state, ...data };

      // Apply to the store first, and synchronously. This used to persist and
      // then $reset(), which threw the new values away: $reset re-runs state(),
      // and state() only fills itself in from an asynchronous storage read that
      // has not resolved yet. So everything read straight after login was still
      // null - including defaultAvatar.homeSpaceId, which is why the HOME button
      // sat greyed out even though every avatar has a home space recorded.
      this.$patch(newUserInfo);

      window.storage.removeItem('USER_INFO');
      window.storage.setItem('USER_INFO', JSON.stringify(newUserInfo));
    },

    async storeInfo(data) {
      const game = useGameStore();

      // add SWSID to axios headers
      axios.defaults.headers.common['swsid'] = data.SWSID.SWSID;

      let { data: userInfo } = await axios.get('/api/user/me');

      this.updateState({
        id: userInfo.id,
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        email: userInfo.email,
        goldBalance: userInfo.goldBalance,
        tokensBalance: userInfo.tokensBalance,
        sex: userInfo.sex,
        citizenLevel: userInfo.citizenLevel,
        role: userInfo.role ?? 'player',
        staffLevel: userInfo.staffLevel ?? 0,
        contentPath: userInfo.contentPath,
        citizenTitle: userInfo.citizenTitle,
        citizenImageExt: userInfo.citizenImageExt,
        defaultAvatar: userInfo.defaultAvatar,
        loyalty: userInfo.loyalty,
        spaces: userInfo.spaces,
        permissions: userInfo.permissions,
        activeAvatars: userInfo.activeAvatars,
      });
      await game.storeInfo(userInfo);

      // No $reset() here. updateState above has already applied everything and
      // persisted it; resetting afterwards wiped the store back to nulls and
      // left the app reading empty state right after login.
    },

    async createAvatar(avatarData) {
      try {
        // Make the API call first (no optimistic update for creation)
        const response = await fetch('/api/avatar/createAvatar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'swsid': useAuthStore().session.SWSID,
          },
          body: JSON.stringify(avatarData),
        });
        
        if (!response.ok) {
          throw new Error('Failed to create avatar');
        }
        
        // Get the server response
        const result = await response.json();
        
        // Create the full avatar object
        const newAvatar = {
          id: result.data.id,
          firstName: result.data.firstName,
          lastName: result.data.lastName,
          fullName: result.data.nameInstance > 1 
            ? this.getOrdinalName(result.data.firstName, result.data.lastName, result.data.nameInstance)
            : `${result.data.firstName} ${result.data.lastName}`,
          gender: result.data.gender,
          snapUrl: result.data.snapUrl,
          nameInstance: result.data.nameInstance,
          thumbUrl: result.data.thumbUrl,
          configXML: result.data.configXML,
        };
        
        // Add to the activeAvatars array
        this.activeAvatars = [...this.activeAvatars, newAvatar];
        
        // Sync to storage
        await this.syncToStorage();
        
        return { data: newAvatar };
      } catch (error) {
        console.error('Error creating avatar:', error);
        throw error;
      }
    },

    async updateAvatar(avatarData) {
      try {
        // 1. Optimistic update - Update the store immediately for UI responsiveness
        this.updateLocalAvatar(avatarData);

        // 2. Make the API call
        const response = await fetch('/api/avatar/updateAvatar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'swsid': useAuthStore().session.SWSID,

          },
          body: JSON.stringify(avatarData),
        });

        if (!response.ok) {
          throw new Error('Failed to update avatar from userstore');
        }

        // 3. Update with server response (which might include additional fields)
        const result = await response.json();
        this.createNewAvatar(result.data);

        // 4. Sync to storage
        await this.syncToStorage();

        return result;
      } catch (error) {
        console.error('Error updating avatar:', error);
        throw error;
      }
    },

    async deleteAvatar(avatarId) {
      try {
        // 1. Optimistic update - Remove the avatar from the store immediately for UI responsiveness
        this.removeAvatar(avatarId);

        // 2. Make the API call
        const response = await fetch('/api/avatar/deleteAvatar/' + avatarId, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'swsid': useAuthStore().session.SWSID,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to delete avatar');
        }

        // 3. Sync to storage
        await this.syncToStorage();
      } catch (error) {
        console.error('Error deleting avatar:', error);
        throw error;
      }
    },
    // Helper method to create a new avatar to the activeAvatars array and set it as default
    createNewAvatar(avatarData) {
      if (!avatarData || !avatarData.id) return;
      // skip if avatar already exists
      // const existingAvatar = this.activeAvatars.find(avatar => avatar.id === avatarData.id);
      // if (existingAvatar) return;
      // Create a new avatar object
      const newAvatar = {
        id: avatarData.id,
        firstName: avatarData.firstName,
        lastName: avatarData.lastName,
        fullName: avatarData.fullName,
        gender: avatarData.gender,
        snapUrl: avatarData.snapUrl,
        nameInstance: avatarData.nameInstance,
        thumbUrl: avatarData.thumbUrl,
        configXML: avatarData.configXML,
      };
      // Add the new avatar to the activeAvatars array
      this.activeAvatars.push(newAvatar);
      // Set the new avatar as the default avatar
      if (!this.defaultAvatar) {
        this.defaultAvatar = newAvatar;
      } 

    },
    // Helper method to remove an avatar from the activeAvatars array


    removeAvatar(avatarId) {
      if (!avatarId) return;

      const avatarIndex = this.activeAvatars.findIndex(avatar => avatar.id === avatarId);
      if (avatarIndex !== -1) {

        this.activeAvatars.splice(avatarIndex, 1);

      }
    },
    // Helper method to update local avatar data
    updateLocalAvatar(avatarData) {
      if (!avatarData || !avatarData.id) return;

      // Update default avatar if it matches
      if (this.defaultAvatar && this.defaultAvatar.id === avatarData.id) {
        // Use spread to ensure reactivity
        this.defaultAvatar = { ...this.defaultAvatar, ...avatarData };
      }

      // Find and update in activeAvatars array
      const avatarIndex = this.activeAvatars.findIndex(avatar => avatar.id === avatarData.id);
      if (avatarIndex !== -1) {
        // Replace the entire object to ensure reactivity
        const updatedAvatars = [...this.activeAvatars];
        updatedAvatars[avatarIndex] = { ...this.activeAvatars[avatarIndex], ...avatarData };
        this.activeAvatars = updatedAvatars;
      }

      // Handle name formatting
      if (this.activeAvatars[0] && this.activeAvatars[0].id === avatarData.id) {
        if (avatarData.nameInstance > 1) {
          const ordinalName = this.getOrdinalName(
            avatarData.firstName,
            avatarData.lastName,
            avatarData.nameInstance
          );
          this.activeAvatars[0].fullName = ordinalName;
        } else if (avatarData.firstName && avatarData.lastName) {
          this.activeAvatars[0].fullName = `${avatarData.firstName} ${avatarData.lastName}`;
        }
      }
    },

    // Helper for ordinal naming
    getOrdinalName(firstName, lastName, instance) {
      if (instance <= 1) return `${firstName} ${lastName}`;

      const suffixes = ["th", "st", "nd", "rd"];
      const v = instance % 100;
      const suffix = suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0];

      return `${firstName} ${lastName} the ${instance}${suffix}`;
    },

    // Synchronize store to storage
    async syncToStorage() {
      try {
        // get current user data and merge with existing data
        const existingData = await window.storage.getItem('USER_INFO');
        const existingUserData = existingData ? JSON.parse(existingData) : {};
        const mergedData = { ...existingUserData, ...this.$state };
        const userData = {
          ...mergedData,
          activeAvatars: this.activeAvatars,
          defaultAvatar: this.defaultAvatar,
        };
        // Save to storage

        await window.storage.removeItem('USER_INFO');
        await window.storage.setItem('USER_INFO', JSON.stringify(userData));
      } catch (error) {
        console.error('Error saving to storage:', error);
      }
    },

    // Load from storage
    async loadFromStorage() {
      try {
        const data = await window.storage.getItem('USER_INFO');
        if (data) {
          const userData = JSON.parse(data);

          // Use $patch for batch updates
          this.$patch({
            activeAvatars: userData.activeAvatars || [],
            defaultAvatar: userData.defaultAvatar || null,
          });
        }
      } catch (error) {
        console.error('Error loading from storage:', error);
      }
    },

    isAdmin() {
      const auth = useAuthStore();
      return (
        this.staffLevel >= 3 ||
        auth.primaryGroupId == 1 ||
        auth.primaryGroupId == 2 ||
        auth.primaryGroupId == 13 ||
        auth.secondaryGroupIds.includes(13)
      );
    },

    // Rank helpers. Deliberately actions, not getters - the store already
    // exposes isAdmin() as an action and callers invoke it, so a getter of
    // the same name breaks assignment and takes the whole renderer down.
    // Levels mirror App\Support\Staff on the backend.
    isStaff() {
      const auth = useAuthStore();
      return this.staffLevel >= 1 || [1, 2, 3, 6, 31].includes(Number(auth.primaryGroupId));
    },

    isModerator() {
      const auth = useAuthStore();
      return this.staffLevel >= 2 || [1, 2, 3].includes(Number(auth.primaryGroupId));
    },

    isDev() {
      const auth = useAuthStore();
      return this.staffLevel >= 4 || Number(auth.primaryGroupId) === 31;
    },

    isOwner() {
      const auth = useAuthStore();
      return this.staffLevel >= 5 || Number(auth.primaryGroupId) === 1;
    }
    },
    
});
