<template>
    <v-list-item
      :prepend-avatar="user.defaultAvatar?.thumbUrl"
      :title="user.firstName + space + user.lastName"
    ></v-list-item>

    <v-divider></v-divider>

    <v-list density="compact" nav>
      <v-list-item
        prepend-icon="mdi-view-dashboard"
        title="Profile"
        value="profile"
        to="/profile"
      ></v-list-item>

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
                :model-value="experActive"
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
        <!-- <v-list-item title="VUE_SMI" value="VUE SMI" v-if="isAdmin" @click="vsmi" /> -->
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
  name: 'profileHeader',
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
    baseUrl: import.meta.env.VITE_DEFAULT_URL,
  }),
  emits: ['triggerDialog', 'smi', 'switchToggle', 'getCurrentRoutes','appPath', 'fixItems', 'vsmi', 'upload', 'invite', 'configStr', 'addItems', 'allItems', 'missingItems'],

  methods : {
    appPath() {
      this.$emit('appPath');
    },
    triggerDialog(payload) {
      this.$emit('triggerDialog', payload);
    },
    smi() {
      this.$emit('smi');
    },
    vsmi()
    {
      this.$emit('vsmi');
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
  },
}
</script>