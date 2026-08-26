<template>
  <div >
    <v-row class="d-flex justify-center" >
      <v-col cols="12">
        <v-card class="pa-4 avi">
          <!-- <v-row>
            <v-col cols="12">
              <h2 class="text-center">Avatars</h2>
              <v-divider></v-divider>
            </v-col>
          </v-row> -->
          <!-- Header ported from SmallVerse's profile-avatar panel: the
               avatar's name with an edit affordance on the left, and the
               "n OF m" counter on the right. -->
          <div class="profile-header">
            <div class="avatar-header-content">
              <div class="avatar-name-wrapper">
                <div class="avatar-name">{{ selectedAvatarName }}</div>
                <button
                  class="avatar-edit-btn"
                  title="Edit Avatar"
                  :disabled="!showEditButton"
                  @click="editAvi"
                >
                  <i class="fa-solid fa-pen-to-square" />
                </button>
              </div>
              <div class="avatar-counter">
                {{ selectedAvatarIndex + 1 }} OF {{ user.activeAvatars.length }}
              </div>
            </div>
          </div>

    <v-slide-group
      ref="slideGroup"
      v-model="model"
      class="pa-4" 
      center-active
      show-arrows
      :class="{ 'center-card': user.activeAvatars.length === 1 }"
      mandatory
      @change="onAvatarChange"
    >
      <!-- Add this to customize the navigation arrows -->
      <template v-slot:prev="{ props }">
        <v-btn
          variant="text"
          color="primary"
          v-bind="props"
          @click.stop="handleArrowClick('prev')"
          icon="mdi-chevron-left"
        ></v-btn>
      </template>
      
      <template v-slot:next="{ props }">
        <v-btn
          variant="text"
          color="primary"
          v-bind="props"
          @click.stop="handleArrowClick('next')"
          icon="mdi-chevron-right"
        ></v-btn>
      </template>
    
      <v-slide-group-item
        v-for="(avatar, index) in user.activeAvatars"
        :key="index"
         
      >
        <v-card
          :color="selectedAvatarIndex === 0 ? '#0099cc' : ''"
          class="ma-3 avi-bg"
          :class="{ 'avi-bg-selected': selectedAvatarIndex === 0, 'hidden-avatar': selectedAvatarIndex !== 0 }"
          height="250"
          width="180"
          @click="handleCardClick(index)"
          >
          <!-- Your existing avatar content -->
          <v-img :src="avatar.snapUrl">
            <!-- position to lower -->
          </v-img>
          <v-img
            v-if="avatar.pet"
            :src="avatar.pet.snapUrl"
            style="
              position: absolute;
              bottom: 0;
              right: 0;
              left: 2;
              width: 128px;
              height: 128px;
            "
          ></v-img>
          <div class="d-flex fill-height align-center justify-center">
            <v-scale-transition>
              <v-icon v-if="selectedAvatarIndex == 0" color="white" size="48"></v-icon>
            </v-scale-transition>
          </div>
        
          <div class="profile-footer">
            <button
              class="avatar-footer-button new-button"
              title="Create a new avatar"
              :disabled="!canCreate"
              @click="createAvi"
            >
              <i class="fa-solid fa-plus" /><span>NEW</span>
            </button>
            <button
              class="avatar-footer-button delete-button"
              title="Remove this avatar"
              :disabled="selectedAvatarIndex === 0"
              @click="deleteAvi"
            >
              <i class="fa-solid fa-trash" /><span>DELETE</span>
            </button>
            <button
              class="avatar-footer-button default-button"
              title="Set as your default avatar"
              :disabled="selectedAvatarIndex === 0"
              @click="onAvatarChange(selectedAvatarIndex)"
            >
              <i class="fa-solid fa-heart" /><span>DEFAULT</span>
            </button>
          </div>

          <div class="take-pet-checkbox">
            <div class="pet-companion-wrapper">
              <input id="take-pet" v-model="takePet" type="checkbox" />
              <label for="take-pet">
                <i class="fa-solid fa-paw" />
                <span>Enable Pet Companion</span>
              </label>
            </div>
          </div>
        </v-card>
      </v-slide-group-item>
    </v-slide-group>

    

    <!-- <v-row justify="end"> -->
    <v-row v-if="selectedAvatarName" class="text-center mt-2 d-flex justify-center align-items-center">
      <v-col cols="auto">
        <h3 class="mr-2">{{ selectedAvatarName }}</h3>
      </v-col>
      
      <v-col cols="auto" 
      v-if="selectedPetStatus"
      >
        
        <v-tooltip v-model="show_p" location="top">
          <template v-slot:activator="{ props }">
            <v-icon-btn

              :icon="selectedPetTake ? 'mdi-paw' : 'mdi-paw-off'"
              
              class="swIBtn mr-2"
              v-bind="props"
              @click="soon"
              variant="text"
              style="position: relative; top: -10px;"
            ></v-icon-btn>
          </template>
          <span ref="create" v-if="selectedPetTake">
            You are taking your pet
          </span>
        </v-tooltip>
      </v-col>
    </v-row>
    
    
<!-- </v-row> -->

   <!-- View Inventory, View Friends btns -->
    <!-- Add a line here -->
    <v-row class="d-flex justify-center">
      <v-col cols="12" class="mt-5">
        <v-divider></v-divider>
      </v-col>
    </v-row>
   <v-col cols="12" class="mt-5">
    <v-row class="d-flex justify-center">
      <v-tooltip v-model="show_inv" location="bottom">
          <template v-slot:activator="{ props }">
        
        <v-icon-btn icon="mdi-bag-personal-outline" class="swIBtn mr-2" v-bind="props" @click="openInventory" variant="outlined" size="large"></v-icon-btn>
          </template>
          <span ref="create">Inventory</span>
        </v-tooltip>
        <v-tooltip v-model="show_f" location="bottom">
          <template v-slot:activator="{ props }">
        <v-icon-btn
          icon="mdi-account-group-outline"
          class="swIBtn mr-2"
          v-bind="props"
          @click="openFriends"
          variant="outlined"
          size="large"
        ></v-icon-btn>
        
        </template>
          <span ref="create">Friends</span>
        </v-tooltip>
         <v-tooltip v-model="show_m" location="bottom">
          <template v-slot:activator="{ props }">
        <v-icon-btn 
          icon="mdi-message-outline"
          class="swIBtn mr-2"
          v-bind="props"
          @click="soon"
          variant="outlined"
          size="large"
        ></v-icon-btn>
      </template>
          <span ref="create">Messages</span>
        </v-tooltip>
        <v-tooltip v-model="show_ppl" location="bottom">
          <template v-slot:activator="{ props }">
        <v-icon-btn 
          icon="mdi-account-search-outline"
          class="swIBtn mr-2"
          v-bind="props"
          @click="openSearch"
          variant="outlined"
          size="large"
        ></v-icon-btn>
        </template>
          <span ref="create">Search People</span>
        </v-tooltip>
        <v-tooltip v-model="show_s" location="bottom">
          <template v-slot:activator="{ props }">
        <v-icon-btn 
          icon="mdi-home-search-outline"
          class="swIBtn mr-2"
          v-bind="props"
          @click="soon"
          variant="outlined"
          size="large"
        ></v-icon-btn>
      </template>
          <span ref="create">Search Places</span>
        </v-tooltip>
       
    </v-row>
  </v-col>
</v-card>
      </v-col>
    </v-row>
    <v-container>
</v-container>

</div>
  <!-- Dialogs  -->
    <!-- Edit Avatar Dialog -->
    <inventory
      :iDialog="inventoryDialog"
      @update:dialog="inventoryDialog = $event"
      @close="closeDialog"
    />
    <create-avatar
  ref="createAvatarComponent"
  :visible="createAvatarDialog"
  @close="closeDialog"
  @save="saveCreateAvatar"
  @checkNameAvailability="handleNameCheckRequest"
/>
<edit-avatar
  ref="editAvatarComponent"
  :visible="editAvatarDialog"
  :user="user.defaultAvatar"
  @saveAvatarChanges="saveAvatarChanges"
  @close="closeDialog"
  @checkNameAvailability="handleNameCheckRequest"
/>
    <delete-avatar
      ref="deleteAvatarComponent"
      :visible="deleteAvatarDialog"
      :user="user.activeAvatars[model]"
      @close="closeDialog"
      @delete="deleteAvatar"
    />
    <find-friends
      :visible="createFriends"
      :user="user.activeAvatars[model]"
      :friends="user.defaultAvatar?.friends || []"
      @close="createFriends = false"
      @triggerSnackbar="triggerSnackbar"
    />
    <search-friends
      :visible="searchFriendsDialog"
      @close="searchFriendsDialog = false"
    />
    <search-places
      :visible="searchPlacesDialog"
      @close="searchPlacesDialog = false"
    />
</template>
<script>
import { ref, computed } from 'vue';
import { useUserStore } from '@/stores/user.js';
import { useAuthStore } from '@/stores/auth.js';
import { storeToRefs } from 'pinia'; // Import storeToRefs
import editAvatar from './dialogs/editAvatar.vue';
import createAvatar from './dialogs/createAvatar.vue';
import deleteAvatar from './dialogs/deleteAvatar.vue';
import inventory from './dialogs/userInventory.vue';
import findFriends from './dialogs/findFriends.vue';
import searchFriends from './dialogs/searchFriends.vue';
import searchPlaces from './dialogs/searchPlaces.vue';

const auth = useAuthStore();
const user = useUserStore();
const userState = ref(null);
const userData = ref({});
export default {
  name: 'aviLayout',
  setup() {
    const userStore = useUserStore();
    const authStore = useAuthStore();
    
    // Use storeToRefs to maintain reactivity
    const { activeAvatars, defaultAvatar } = storeToRefs(userStore);
    
    return {
      userStore,
      authStore,
      activeAvatars,
      defaultAvatar
    };
  },
  emits: ['triggerSnackbar'],
  components: {
    editAvatar,
    createAvatar,
    deleteAvatar,
    inventory,
    findFriends,
    searchFriends,
    searchPlaces,
  },
  data() {
    return {
      // Pet companion toggle shown in the panel footer.
      takePet: false,
      model: 0, // Default to the first avatar
      show_c: false,
      show_p: false,
      show_r: false,
      show_d: false,
      show_inv: false,
      show_f: false,
      show_ppl: false,
      show_s: false,
      show_m: false,
      uState: null,
      msg: '',
      activeWarnShown: false,
      editAvatarDialog: false,
      createAvatarDialog: false,
      deleteAvatarDialog: false,
      inventoryDialog: false,
      createFriends: false,
      searchFriendsDialog: false,
      searchPlacesDialog: false,
      // initialLoad: true,
      prevClickHandler: null,
      nextClickHandler: null,
      selectedAvatarIndex: 0,
      showEditButton: true,
      avatarNameOverride: null,
    };
  },
  computed: {
    user() {
      const userStore = useUserStore();
      return userStore;
    },
    auth() {
      const authStore = useAuthStore();
      return authStore;
    },
    // Use computed property for selectedAvatar
    selectedAvatar() {
      if (this.model !== null && this.userStore.activeAvatars[this.model]) {
        return this.userStore.activeAvatars[this.model];
      }
      return null;
    },
    selectedAvatarName() {
      // First check if there's an override value
      if (this.avatarNameOverride && this.model === 0) {
        return this.avatarNameOverride;
      }
      
      // Otherwise use the selected avatar
      if (this.selectedAvatar) {
        return this.selectedAvatar.fullName;
      }
      return null;
    },
    selectedAvatarId() {
      if (this.model !== null && this.user.activeAvatars[this.model]) {
        return this.user.activeAvatars[this.model].id;
      }
      return null;
    },
    selectedPetStatus() {
      if (this.model !== null && this.user.activeAvatars[this.model]) {
        if (this.user.activeAvatars[this.model].pet) {
          return this.user.activeAvatars[this.model].pet.status;
        }
      }
      return null;
    },
    selectedPetTake() {
      if (this.model !== null && this.user.activeAvatars[this.model] && this.user.activeAvatars[this.model].pet.takePet) {
        return true;
      }
      return null;
    },

    canCreate() {
      // Check if user is admin and if is they can create more than 5 avatars else only 5 avatars
      const isAdmin = this.userStore.isAdmin();

      if (isAdmin) {
        return true; // Admins can create more than 5 avatars
      } else {
        return this.userStore.activeAvatars.length < 5; // Regular users can have up to 5 avatars
      }
    },
  },
  watch: {
    // model(newIndex) {
    //   if (newIndex === undefined || newIndex === null) {this.model = 0; return;}
    //   if (newIndex === 0 && !this.activeWarnShown) {
    //   this.$emit('triggerSnackbar', {
    //     text: 'This is your active avatar!',
    //     color: 'info',
    //     icon: 'mdi-information',
    //     timeout: 5000,
    //     variant: 'flat',
    //     offset: 0,
    //     }); 
    //     this.activeWarnShown = true;
    //     return;} 
    //     else {
    //     this.onAvatarChange(newIndex);}
    // },

    // watch for changes in the user store 
    user: {
      handler(newValue) {
        // Check if the user has changed
        if (newValue && newValue.activeAvatars && newValue.activeAvatars.length > 0) {
          this.model = 0; // Reset to the first avatar
          this.showEditButton = true;
        }
      },
      deep: true,
    },

  },
  methods: {
    handleCardClick(index) {
      // Clear the override when changing avatars
      if (this.model === 0 && index !== 0) {
        this.avatarNameOverride = null;
      }
      
      this.model = index;
      // If clicking on non-default avatar (index > 0), trigger avatar change
      if (index > 0) {
        this.onAvatarChange(index);
        this.selectedAvatarIndex = 0;
        this.showEditButton = true;
      } else if (index === 0 && !this.activeWarnShown) {
        this.$emit('triggerSnackbar', {
          text: 'This is your active avatar!',
          color: 'info',
          icon: 'mdi-information',
          timeout: 5000,
          variant: 'flat',
          offset: 0,
        }); 
        this.activeWarnShown = true;
      }
    },
    async handleNameCheckRequest({ firstName, lastName, callback }) {
  const result = await this.checkNameAvailability({ firstName, lastName });
  if (typeof callback === 'function') {
    callback(result);
  }
},
    async onAvatarChange(newIndex) 
    {
      
      try {
      if (newIndex === undefined) return;
      else if (newIndex < 0) return;
      else if (newIndex == 0) return;
     
      // call api to set active avatar
      const res = await fetch('/api/avatar/makeDefaultAvatar/' + this.selectedAvatarId, 
      {
          method: 'POST',
          headers: 
          {
            'Content-Type': 'application/json',
            SWSID: auth.session.SWSID,
          },
      });

      const data = await res.json();

      // ui updates to reposition the avatars
      const avatarIndex = this.user.activeAvatars.findIndex(avatar => avatar.id === this.selectedAvatarId);
        
      if (avatarIndex > -1) 
      {
        const [selectedAvatar] = this.user.activeAvatars.splice(avatarIndex, 1);
        this.user.activeAvatars.unshift(selectedAvatar);
        this.model = 0; // Set model to 0 to keep the selected avatar
      }

      // get the user state from electron storage
      const uState = await window.storage.getItem('USER_INFO');
      this.uState = (JSON.parse(uState));
      
      // update the state in the user store of defaultAvatar to data.avatar
      this.uState.defaultAvatar = data.avatar;
      this.user.defaultAvatar = data.avatar;
      // update the first element in the activeAvatar array to the 
      for (let i = 0; i < this.uState.activeAvatars.length; i++) {
        // reposition the selected avatar to the first element
        if (this.uState.activeAvatars[i].id === data.avatar.id) {
          this.uState.activeAvatars.unshift(this.uState.activeAvatars.splice(i, 1)[0]);
          break;
        }
      }

      // must remove to update state of electron storage
      await window.storage.removeItem('USER_INFO');
      await window.storage.setItem('USER_INFO', JSON.stringify(this.uState));

      // show a snackbar message of success?
      this.$emit('triggerSnackbar', {
        text: data.avatar.fullName + ' is now your active avatar!',
        color: 'success',
        icon: 'mdi-check',
        timeout: 5000,
        variant: 'flat',
        offset: 0,
      });
      // update the rpc
      window.rpc.setRPC({
        state: this.user.activeAvatars[this.model].firstName + ' ' + this.user.activeAvatars[this.model].lastName,
        party: {
          id: this.auth.session.swsid,
          size: [1, this.user.activeAvatars.length],
        },
      });
    } catch (error) {
      console.error('Error setting active avatar', error);
      // set back to initial selected avatar
      this.model = this.user.activeAvatars.findIndex(avatar => avatar.id === this.user.defaultAvatar.id);
      this.$emit('triggerSnackbar', {
        text: (this.msg.length > 0) ? this.msg : 'Error setting active avatar',
        color: 'error',
        icon: 'mdi-alert',
        timeout: 5000,
        variant: 'flat',
        offset: 0,
      });
    }
    },
    openInventory() {
      this.inventoryDialog = true;
      // set rpc
      window.rpc.setRPC({
        details: 'Viewing Inventory',
        state: this.user.activeAvatars[this.model].firstName + ' ' + this.user.activeAvatars[this.model].lastName,
        party: {
          id: this.auth.session.swsid,
          size: [1, this.user.activeAvatars.length],
        },
      });
    },
    openFriends() {
      this.createFriends = true;
      // pass the current avi id in the carousel
      this.friendCarouselId = this.user.activeAvatars[this.model].id;
      // set rpc
      window.rpc.setRPC({
        details: 'Viewing Friends',
        state: this.user.activeAvatars[this.model].firstName + ' ' + this.user.activeAvatars[this.model].lastName,
        party: {
          id: this.auth.session.swsid,
          size: [1, this.user.activeAvatars.length],
        },
      });
    },
    createAvi() {
      this.createAvatarDialog = true;
      // set rpc
      window.rpc.setRPC({
        details: 'Creating an Avatar',
        state: this.user.activeAvatars[this.model].firstName + ' ' + this.user.activeAvatars[this.model].lastName,
        party: {
          id: this.auth.session.swsid,
          size: [1, this.user.activeAvatars.length],
        },
      });
    },
    editAvi() 
    {
      // open dialog to editAvatar
      this.editAvatarDialog = true;
      // set rpc
      window.rpc.setRPC({
        details: 'Editing an Avatar',
        state: this.user.activeAvatars[this.model].firstName + ' ' + this.user.activeAvatars[this.model].lastName,
        party: {
          id: this.auth.session.swsid,
          size: [1, this.user.activeAvatars.length],
        },
      });
    }, 
    deleteAvi() {
      this.deleteAvatarDialog = true;
    },
    closeDialog() {
      this.createAvatarDialog = this.editAvatarDialog = this.inventoryDialog = this.deleteAvatarDialog = false;
      window.rpc.setRPC({
        details: 'Profile',
        state: this.user.activeAvatars[this.model].firstName + ' ' + this.user.activeAvatars[this.model].lastName,
        party: {
          id: this.auth.session.swsid,
          size: [1, this.user.activeAvatars.length],
        },
      });
    },
    async checkNameAvailability(data) {
      try {
        // Show loading in the component that called this method
        this.$emit('nameCheckStarted');
        
        const response = await fetch('/api/avatar/nameavailable', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            SWSID: this.auth.session.SWSID,
          },
          body: JSON.stringify(data),
        });
        
        if (!response.ok) {
          throw new Error('Failed to check name availability');
        }
        
        const result = await response.json();
        
        // Return a complete result object with all needed information
        return {
          isAvailable: !!result.value,
          nameInstance: result.nameInstance || 1,
          message: result.message || '',
          ordinalName: this.getOrdinalName(data.firstName, data.lastName, result.nameInstance)
        };
      } catch (error) {
        console.error('Error checking name availability:', error);
        return {
          isAvailable: false,
          nameInstance: 0,
          message: error.message || 'Error checking name availability',
          ordinalName: null
        };
      }
    },
    getOrdinalName(firstName, lastName, instance) {
      if (instance <= 1) return null;
      
      const suffixes = ["th", "st", "nd", "rd"];
      const value = instance % 100;
      const suffix = suffixes[(value - 20) % 10] || suffixes[value] || suffixes[0];
      
      return `${firstName} ${lastName} the ${instance}${suffix}`;
    },
    async saveCreateAvatar(data) {
      try {
        // Show loading message
        this.$emit('triggerSnackbar', {
          text: 'Creating your new avatar...',
          color: 'info',
          icon: 'mdi-loading',
          timeout: 5000,
        });
        
        // Call the store method to create the avatar
        const result = await this.userStore.createAvatar(data);
        
        // Close the dialog
        this.$refs.createAvatarComponent.finishSaving();
        
        if (result.data) {
          // Add the new avatar to the carousel if it doesn't exist already
          const newAvatar = result.data;

          const existingIndex = this.user.activeAvatars.findIndex(avatar => avatar.id === newAvatar.id);
          
          if (existingIndex === -1) {
            // Add the new avatar to the end of the array
            this.user.activeAvatars.push(newAvatar);
          }
          // Show success message
          this.$emit('triggerSnackbar', {
            text: `${newAvatar.fullName} created successfully!`,
            color: 'success',
            icon: 'mdi-check-circle',
            timeout: 5000,
            variant: 'flat',
            offset: 0,
          });
          
          // Scroll to the newly created avatar after a short delay
          // to allow the carousel to update
          setTimeout(() => {
            // Set model to the position of the new avatar
            this.model = this.user.activeAvatars.length - 1;
            this.selectedAvatarIndex = this.model;
            this.handleCardClick(this.model);
            window.rpc.setRPC({
              state: this.user.activeAvatars[this.model].firstName + ' ' + this.user.activeAvatars[this.model].lastName,
              party: {
                id: this.auth.session.swsid,
                size: [1, this.user.activeAvatars.length],
              },
            });
          }, 300);

          
        }
      } catch (error) {
        console.error('Error creating avatar:', error);
        this.$refs.createAvatarComponent.finishSaving(error);
        
        // Show error message
        this.$emit('triggerSnackbar', {
          text: 'Failed to create avatar. Please try again.',
          color: 'error',
          icon: 'mdi-alert-circle',
          timeout: 5000,
          offset: 0,
        });
      }
    },
    async saveAvatarChanges(data) { 
      try {
        // Use the store action instead of direct API call
        const result = await this.userStore.updateAvatar(data);

        // Only update the override if we're currently viewing the default avatar
        if (this.model === 0) {
          // if (result.data.nameInstance > 1) {
          //   this.avatarNameOverride = this.userStore.getOrdinalName(
          //     result.data.firstName, 
          //     result.data.lastName,
          //     result.data.nameInstance
          //   );
          // } else {
          //   this.avatarNameOverride = `${result.data.firstName} ${result.data.lastName}`;
          // }
        }
        if (!result.error){
        // Close dialog and show success
        this.$refs.editAvatarComponent.finishSaving();
        this.$emit('triggerSnackbar', {
          text: 'Avatar updated successfully!',
          color: 'success',
          icon: 'mdi-check-circle',
          timeout: 3000,
          offset: 0,
          variant: 'flat',
        });
        window.rpc.setRPC({
          state: this.user.defaultAvatar.firstName + ' ' + this.user.defaultAvatar.lastName,
        });
        } else {
          // Show error message
          this.$emit('triggerSnackbar', {
            text: result.error,
            color: 'error',
            icon: 'mdi-alert-circle',
            timeout: 5000,
            offset: 0,
          });
      }
      } catch (error) {
        console.error('Error saving avatar changes from aviLayout:', error);
        this.$refs.editAvatarComponent.finishSaving(error);
        this.$emit('triggerSnackbar', {
          text: 'Failed to update avatar. Please try again.',
          color: 'error',
          icon: 'mdi-alert-circle',
          timeout: 5000,
          offset: 0,
        });
      }
    },
    deleteAvatar() {
      const deletedIndex = this.model;
      // Call the delete avatar method from the store
      this.userStore.deleteAvatar(this.selectedAvatarId)
        .then(() => {
          this.$refs.deleteAvatarComponent.finishDelete();
          this.$emit('triggerSnackbar', {
            text: 'Avatar deleted successfully!',
            color: 'success',
            icon: 'mdi-check-circle',
            timeout: 3000,
            offset: 0,
          });
          this.model = 0;
          this.selectedAvatarIndex = 0;
          this.showEditButton = true;
          
          // If the avatars array is now empty, reset UI elements
          if (this.user.activeAvatars.length === 0) {
            this.avatarNameOverride = null;
          }

          // update the rpc 
          window.rpc.setRPC({
            party: {
              id: this.auth.session.swsid,
              size: [1, this.user.activeAvatars.length],
            },
          });
        })
        .catch((error) => {
          console.error('Error deleting avatar:', error);
          this.$emit('triggerSnackbar', {
            text: 'Failed to delete avatar. Please try again.',
            color: 'error',
            icon: 'mdi-alert-circle',
            timeout: 5000,
            offset: 0,
          });
        });
    },
    soon()
    {
      this.$emit('triggerSnackbar', {
        text: 'Coming soon!',
        color: 'warning',
        icon: 'mdi-information',
        timeout: 5000,
        variant: 'flat',
        offset: 0,
      });
    },
    triggerSnackbar(data) {
      this.$emit('triggerSnackbar',data);
    },
    // Add these new navigation methods

    handleArrowClick(direction) {      
      // Only clear the override when navigating away from position 0
      // if (this.model > 0) {
        // this.avatarNameOverride = null;
      // }
      
      
      // Update the model directly based on direction
      if (direction === 'prev' && this.model > 0) {
        this.model -= 1;
        this.selectedAvatarIndex = this.model;
      } else if (direction === 'next' && this.model < this.user.activeAvatars.length - 1) {
        this.model += 1;
        this.selectedAvatarIndex = this.model;
      }
      
      if (this.model === 0) {
        this.showEditButton = true;
        // show the name of override
        // this.avatarNameOverride = this.user.activeAvatars[0].fullName;
      } else {
        this.showEditButton = false;
      }
    }
      // You can also update the model or do other actions here
    //   if (direction === 'prev' && this.model > 0) {
    //     this.model -= 1;
    //   } else if (direction === 'next' && this.model < this.user.activeAvatars.length - 1) {
    //     this.model += 1;
    //   }
    //   this.onModelChange();
    // },
    // Your other existing methods remain the same
  },
  mounted() {
    // Ensure the first avatar is selected by default
    if (this.user.activeAvatars.length > 0) {
      this.model = 0;
      this.showEditButton = true;
    }

    // if this.user is not set, fetch the user
    if (!this.user.id) {
      // logout
      this.auth.logout();
    } 

    // Add this to your mounted hook
    this.unsubscribeStore = this.userStore.$subscribe((mutation, state) => {
      console.log('Store mutation:', mutation.type, mutation.storeId);
      
      // Update avatarNameOverride if the model is at position 0 and default avatar changes
      if (this.model === 0 && mutation.storeId === 'user') {
        const defaultAvatar = state.defaultAvatar || state.activeAvatars[0];
        
        if (defaultAvatar) {
          if (defaultAvatar.nameInstance > 1) {
            this.avatarNameOverride = this.userStore.getOrdinalName(
              defaultAvatar.firstName,
              defaultAvatar.lastName,
              defaultAvatar.nameInstance
            );
          } else {
            this.avatarNameOverride = `${defaultAvatar.firstName} ${defaultAvatar.lastName}`;
          }
        }
      }
    });
  },
  
  beforeUnmount() {
    // Clean up subscription
    if (this.unsubscribeStore) {
      this.unsubscribeStore();
    }
  }
}
</script>

<style>
/* ---- ported from SmallVerse profile.css ---- */

.profile-header {
  background-color: #1e304d;
  height: 40px;
  border-radius: 5px 5px 0 0;
  margin: -16px -16px 16px -16px;
  position: relative;
  display: flex;
  align-items: center;
}

.avatar-header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 0 15px;
  gap: 10px;
  overflow: hidden;
}

.avatar-name-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.avatar-name {
  color: white;
  font-weight: bold;
  font-size: 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 220px;
}

.avatar-edit-btn {
  background: transparent;
  border: none;
  color: #7eb8ff;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 4px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.avatar-edit-btn:hover:not(:disabled) {
  background: rgba(126, 184, 255, 0.2);
  color: #a8d0ff;
  transform: scale(1.1);
}

.avatar-edit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.avatar-counter {
  background-color: #385077;
  border: 1px solid #5574a7;
  border-radius: 100px;
  padding: 4px 10px;
  font-size: 12px;
  color: white;
  flex-shrink: 0;
  white-space: nowrap;
}

.profile-footer {
  height: 40px;
  margin: 0 -16px;
  font-family: 'VAG Rounded';
  background-color: #ffffff;
  border-top: 1px solid #d3d3d3;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  padding: 15px;
}

.avatar-footer-button {
  background-color: #e6e6e6;
  border: 1px solid #d3d3d3;
  border-radius: 4px;
  width: 30%;
  height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 12px;
  gap: 5px;
  color: #333;
}

.avatar-footer-button:hover:not(:disabled) { background-color: #d9d9d9; }
.avatar-footer-button:disabled { opacity: 0.45; cursor: not-allowed; }
.avatar-footer-button i { font-size: 12px; }
.default-button i { color: #fb5cb6; }
.delete-button i { color: #d9534f; }
.new-button i { color: #47a403; }

.take-pet-checkbox {
  margin: 0 -16px -16px -16px;
  padding: 12px 20px;
  border-top: 1px solid #d3d3d3;
}

.pet-companion-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.take-pet-checkbox input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: #47a403;
}

.take-pet-checkbox label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #1e304d;
  user-select: none;
}

.take-pet-checkbox label:hover { color: #47a403; }
.take-pet-checkbox label i { color: #47a403; font-size: 16px; }

/* Panel shell. The teal gradient came from the open-source build and clashed
   with everything else on the page - this matches the white/navy card system
   used by the rest of the profile. */
.avi{
  background: var(--sw-panel, #fff);
  border: 1px solid var(--sw-border, #cfcfcf);
  border-radius: 5px;
  color: #333;
}

/* Vuetify paints its own surface colour onto v-card; override it so the panel
   is actually white rather than the dark theme surface. */
.avi.v-card,
.avi .v-card__underlay,
.avi > .v-card__overlay {
  background-color: var(--sw-panel, #fff) !important;
  color: #333 !important;
}

.avi .v-card-title,
.avi p,
.avi span,
.avi .avatar-counter {
  color: #333;
}
.avi-bg-selected
{
  border: 3px solid var(--sw-green, #47a403);
  border-radius: 6px;
  box-shadow: 0 0 0 3px rgba(71, 164, 3, 0.18),
              0 4px 12px rgba(30, 48, 77, 0.2);
}
.avi-bg {
  border-radius: 6px;
  box-shadow: inset 0 2px 8px rgba(30, 48, 77, 0.12);
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.2s;
  /* Soft studio backdrop instead of the wood-plank photo - the avatar is the
     subject, the stage should recede. */
  background: radial-gradient(circle at 50% 38%, #ffffff 0%, #e8eef7 60%, #d5deec 100%);
  border: 1px solid var(--sw-border, #cfcfcf);
}

.avi-bg:hover {
  transform: translateY(-2px);
  box-shadow: inset 0 2px 8px rgba(30, 48, 77, 0.12),
              0 6px 14px rgba(30, 48, 77, 0.18);
}
.v-overlay__content {
  align-items: center;
}
.center-card {
  align-items: center;
  justify-content: center;

}



/* Add this new style for hidden avatars */
.hidden-avatar {
  opacity: 0.3;
  transition: opacity 0.7s ease;
  position: relative !important;
}
.hidden-avatar:hover {
  opacity: 1 !important;
  position: relative !important;
  /* transform: scale(1.05); */
  z-index: 1;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  background-color: #0099cc;
  border-radius: 10px;
  border: 3px solid #0099cc;
  transition: opacity 0.5s ease, transform 3s ease;
}  /* Added missing closing brace for the .hidden-avatar:hover class */


/* Carousel arrows. They were white, which was fine on the old teal card and
   invisible on the white panel. Narrow fixed gutters too, so the arrows sit
   inside the panel instead of being clipped by it. */
.v-slide-group__prev,
.v-slide-group__next {
  border-radius: 50%;
  min-width: 30px !important;
  max-width: 30px !important;
  min-height: 30px !important;
  flex: 0 0 30px !important;
  display: flex !important;
  align-items: center;
  justify-content: center;
  color: var(--sw-navy, #1e304d) !important;
}

.v-slide-group__prev--disabled,
.v-slide-group__next--disabled {
  opacity: 0.25;
}


/* Style for when avatar is being navigated to */
.v-slide-group-item--active .hidden-avatar {
  opacity: 1 !important;
  position: relative !important;
}

/* Additional styles to center the active avatar */
.v-slide-group__content {
  justify-content: center;
}

/* Fluid rather than pinned to 340px: the panel is 340px wide including its
   own padding, so a fixed 340px track overflowed and clipped the right arrow. */
.v-slide-group__container {
  height: 270px;
  display: flex;
  width: 100% !important;
  overflow: hidden;
  flex-direction: row;
  align-items: center;
}

.v-slide-group
{
  width: 100% !important;
  max-width: 100% !important;
  margin: 0 auto !important;
}

/* Add this new style for the avatar counter */
.avatar-counter {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  background-color: rgba(0, 153, 204, 0.5);
  padding: 2px 12px;
  border-radius: 12px;
  display: inline-block;
  margin-top: -5px;
}
.inventory-container {
  display: flex; /* Use flexbox to position the panels side by side */
}

.inventory-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  width: 100%; /* Adjust the width as needed */
  /* graident  of rgb(20,149,179) */
  background: linear-gradient(
    135deg,
    rgba(20, 149, 179, 0.5),
    rgba(20, 149, 179, 0.5)
  );
    padding: 16px;
    border-radius: 8px;

}
.sw-grid
{
  background: linear-gradient(
    135deg,
    rgba(20, 149, 179, 0.5),
    rgba(20, 149, 179, 0.5)
  );
  border-radius: 8px;
}
</style>