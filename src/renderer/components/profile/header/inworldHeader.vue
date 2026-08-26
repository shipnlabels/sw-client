<template>
  <v-list-item
    :prepend-avatar="user.$state.defaultAvatar?.thumbUrl"
    :title="user.$state.firstName + space + user.$state.lastName"
  ></v-list-item>

  <v-divider></v-divider>

  <v-list density="compact" nav>
    <v-list-item
      prepend-icon="mdi-view-dashboard"
      title="Profile"
      value="profile"
      @click="triggerRDialog({
        url: 'profile',
      })"
    ></v-list-item>
    <!--     
       -->

    <!-- <v-list-item prepend-icon="mdi-gavel" title="Admin"></v-list-item> -->
    <v-list-group value="toggles">
      <template v-slot:activator="{ props }">
        <v-list-item
          v-bind="props"
          prepend-icon="mdi-tune-variant"
          title="Toggles"
          value="home"
        ></v-list-item>
      </template>
      <v-list-item value="pet">
        <template v-slot:prepend="{  }">
          <v-list-item-action start>
            <v-switch
              color="info"
              :model-value="petActive"
              @change="switchToggle('updateTakePet', petActive)"
            ></v-switch>
          </v-list-item-action>
        </template>

        <v-list-item-title>Take Pet</v-list-item-title>

        <v-list-item-subtitle> In-World </v-list-item-subtitle>
      </v-list-item>
      <v-list-item value="header">
        <template v-slot:prepend="{  }">
          <v-list-item-action start>
            <v-switch
              color="info"
              :model-value="headerActive"
              @change="switchToggle('header', headerActive)"
            ></v-switch>
          </v-list-item-action>
        </template>

        <v-list-item-title>SW Header</v-list-item-title>
      </v-list-item>
      <v-list-item value="experiment">
        <template v-slot:prepend="{  }">
          <v-list-item-action start>
            <v-switch
              color="info"
              @change="switchToggle('experiment', experActive)"
            ></v-switch>
          </v-list-item-action>
        </template>

        <v-list-item-title>Experimental</v-list-item-title>

        <v-list-item-subtitle> No PHP </v-list-item-subtitle>
      </v-list-item>
    </v-list-group>
    <v-list-group value="admin" v-if="isAdmin || hasInviteControl || hasWebsiteControl || isSuperAdmin">
      <template v-slot:activator="{ props }">
        <v-list-item
          v-bind="props"
          prepend-icon="mdi-gavel"
          title="Admin"
          value="home"
        ></v-list-item>
      </template>
      <!-- @click = new window -->
      <v-list-item title="SMI" value="SMI" v-if="isAdmin" @click="smi" />
      <v-list-item
        title="Upload"
        value="upload"
        v-if="isAdmin"
        @click="upload
        "
      />
      <v-list-item
        title="Invite"
        value="invite"
        v-if="hasInviteControl || isSuperAdmin"
        @click="invite
        "
      />
      <v-list-item
        title="Config Strings"
        value="config"
        v-if="isAdmin"
        @click="configStr
        "
      />
      <v-list-item title="Database" value="database" v-if="isSuperAdmin" />

      <v-list-group value="items" v-if="hasWebsiteControl">
        <template v-slot:activator="{ props }">
          <v-list-item
            v-bind="props"
            title="Item Functions"
            value="itemFunc"
          ></v-list-item>
        </template>
        <v-list-item
          title="Fix Items"
          value="fix"
          @click="fixItems"
        />
        <v-list-item
          title="Add Items"
          value="add"
          v-if="isAdmin"
          @click="addItems
          "
        />
        <v-list-item
          title="All Items"
          value="all"
          @click="allItems
          "
        />
        <v-list-item
          title="Missing Items"
          value="missing"
          @click="missingItems
          "
        />
      </v-list-group>
    </v-list-group>
  </v-list>
</template>

<script>

export default {
name: 'inworldHeader',
props: {
  user: {
    type: Object,
    required: true,
  },
  petActive: {
    type: Boolean,
    required: true,
  },
  headerActive: {
    type: Boolean,
    required: true,
  },
  experActive: {
    type: Boolean,
    required: true,
  },
  isAdmin: {
    type: Boolean,
    required: true,
  },
  hasInviteControl: {
    type: Boolean,
    required: true,
  },
  hasWebsiteControl: {
    type: Boolean,
    required: true,
  },
  hasRemember: {
    type: Boolean,
    required: true,
  },
  isSuperAdmin: {
    type: Boolean,
    required: true,
  },

},
data: () => ({
  space: ' ',
  isRemembered: false,
  baseUrl: import.meta.env.VITE_DEFAULT_URL,
}),
emits: ['triggerRDialog', 'smi', 'switchToggle', 'getCurrentRoutes', 'triggerDialog', 'appPath', 'fixItems', 'upload', 'invite', 'configStr', 'addItems', 'allItems', 'missingItems'
],
methods : {
  appPath() {
    this.$emit('appPath');
  },
  triggerRDialog(payload) {
    if (this.isRemembered){
      this.$router.push({ name: payload.url });
    } 
    else
      this.$emit('triggerRDialog', payload);
  },
  triggerDialog(payload) {
    this.$emit('triggerDialog', payload);
  },
  smi() {
    this.$emit('smi');
  },
  fixItems() {
    this.$emit('fixItems');
  },
  upload() {
    this.$emit('upload');
  },
  invite() {
    this.$emit('invite');
  },
  configStr() {
    this.$emit('configStr');
  },
  addItems() {
    this.$emit('addItems');
  },
  allItems() {
    this.$emit('allItems');
  },
  missingItems() {
    this.$emit('missingItems');
  },
  switchToggle(payload, model) {
      this.$emit('switchToggle', payload, model);
    },
 
  getCurrentRoutes() {
    this.$emit('getCurrentRoutes');
  },
  async isNavRemembered(event) {
    if(event.origin !== import.meta.env.VITE_DEFAULT_URL) return;
    if (event.data.data.rememberNavigation) {
      this.isRemembered = true;
      localStorage.setItem('navRemembered', true);
    } else {
      this.isRemembered = false;
      localStorage.setItem('navRemembered', false);
    }
  },
},
mounted() {
  // window.frame.isNavigationRemembered();
  window.addEventListener('message', this.isNavRemembered, false);
},
watch: {
  'isRemembered': function (val) {
    this.isRemembered = val;
    // console.log('isRemembered: ' + val);
  },  
}
}
</script>