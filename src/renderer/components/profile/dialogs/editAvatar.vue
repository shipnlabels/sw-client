<template>
  <v-dialog
    v-model="dialog"
    max-width="500"
    :persistent="isSaving"
  >
    <v-card class="sw-dialog">
      <v-card-title class="sw-dialog-header">
        Edit Avatar
        <v-btn icon color="white darken-1" class="swCloseBtn" @click="close" variant="tonal" :disabled="isSaving">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-card-text class="sw-dialog-content">
        <v-form ref="form">
          <v-container>
            <v-row>
              <v-col cols="12">
                <!-- An existing avatar's name is permanent - this dialog only
                     changes its look, so the name is shown, not editable. -->
                <div class="avatar-name-display">
                  <div class="avatar-name-label">Editing</div>
                  <h3 class="avatar-name-value">{{ avatarDisplayName }}</h3>
                </div>
              </v-col>
            </v-row>
            <!-- Gender is fixed once an avatar exists: this dialog changes
                 look only. Switching it here rewrote the config's gender
                 attribute, which swaps the whole body rig rather than
                 restyling the avatar. -->
            <v-row v-if="isAdminComputed" justify="center">
              <v-col cols="12" class="d-flex justify-end">
                <v-btn
                  color="#0099cc"
                  @click="showXML = !showXML"
                  size="small"
                  class="mb-2"
                  :disabled="isSaving"
                >
                  {{ showXML ? 'Hide XML' : 'Show XML' }}
                  <v-icon right>
                    {{ showXML ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
                  </v-icon>
                </v-btn>
              </v-col>
              <v-col cols="12" v-if="showXML">
                <v-textarea 
                  v-model="configXML" 
                  label="Config XML"
                  dense
                  variant="solo-filled"
                  auto-grow
                  class="xml-textarea"
                  :disabled="isSaving"
                ></v-textarea>
              </v-col>
            </v-row>
          </v-container>
        </v-form>
      </v-card-text>
      <v-card-actions class="sw-dialog-actions">
        <v-spacer></v-spacer>
        <v-btn 
          color="darken-1" 
          class="swBtn flex-grow-1" 
          @click="save" 
          variant="flat"
          :loading="isSaving"
          :disabled="isSaving || !hasChanges"
        >
          Save
        </v-btn>
        <v-spacer></v-spacer>
      </v-card-actions>
      
      <!-- Loading overlay that covers the entire dialog -->
      <v-overlay
        v-if="isSaving"
        class="align-center justify-center"
        contained
        :value="isSaving"
      >
        <v-progress-circular
          indeterminate
          color="#0099cc"
          size="64"
        ></v-progress-circular>
      </v-overlay>
    </v-card>
  </v-dialog>
</template>

<script>
import { useUserStore } from '@/stores/user.js';
import { useAuthStore } from '@/stores/auth.js';

export default {
  name: 'EditAvatarDialog',
  props: {
    visible: {
      type: Boolean,
      required: true,
    },
    user: {
      type: Object,
      default: () => ({}),
      required: true,
    },
  },
  emits: ['close', 'saveAvatarChanges'],
  data() {
    return {
      gender: 'male',
      configXML: '',
      showXML: false,
      isSaving: false,
      id: null,
      originalGender: '',
      originalConfigXML: '',
    };
  },
  computed: {
    isAdminComputed() {
      const auth = useAuthStore();
      return (
        auth.primaryGroupId === 1 ||
        auth.primaryGroupId === 2 ||
        auth.primaryGroupId === 13 ||
        auth.secondaryGroupIds.includes(13)
      );
    },
    hasChanges() {
      // Look-only: the config is the sole editable thing here.
      return this.configXML !== this.originalConfigXML;
    },
    avatarDisplayName() {
      const avatar = this.user || {};
      return avatar.fullName ||
        [avatar.firstName, avatar.lastName].filter(Boolean).join(' ');
    },
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
  watch: {
    user: {
      handler(newVal) {
        if (newVal) {
          this.gender = newVal.gender || '';
          this.configXML = newVal.configXML || '';
          this.id = newVal.id || null;
          this.originalGender = newVal.gender || '';
          this.originalConfigXML = newVal.configXML || '';
        }
      },
      immediate: true,
    },
    // Retained for the create flow's benefit only; edit never changes gender.
    gender(newVal) {

      if (newVal === 'male') {
      // Change from female to male
      this.configXML = this.configXML.replace(/<avatar\s+gender="female"/g, '<avatar gender="male"');
    } else if (newVal === 'female') {
      // Change from male to female
      this.configXML = this.configXML.replace(/<avatar\s+gender="male"/g, '<avatar gender="female"');
    }
    },
  },
  methods: {
    close() {
      if (!this.isSaving) {
        this.$emit('close');
      }
      

    },
    finishSaving(error = null) {
      this.isSaving = false;

      if (!error) {
        //show msg
        // Successfully saved, now close the dialog
        // update the original values to the new values
        this.originalGender = this.gender;
        this.originalConfigXML = this.configXML;
        this.close();
      }
      // clear the form to default values
      this.gender = this.originalGender;
      this.configXML = this.originalConfigXML;

    },
    async save() {
      this.isSaving = true;

      try {
        // Name fields are deliberately absent - an existing avatar's name
        // cannot be changed, only its look.
        const avatarData = {
          // gender is intentionally omitted - it is not editable here, and
          // sending it would let a tampered client flip the body rig.
          configXML: this.configXML,
          id: this.id,
        };

        // Emit the save event with the data
        // The parent component will handle the actual API call
        // show loading until the API call is complete
        if (this.$refs.form) {
          this.$refs.form.validate();
        }
        this.$emit('saveAvatarChanges', avatarData);
        // this.isSaving = false;
      } catch (error) {
        console.error('Error saving avatar from editAvatar.vue:', error);
        this.isSaving = false;
        
      } 
    },
  },
 
};
</script>

<style scoped>
.close-btn {
  position: absolute;
  right: 8px;
  top: 8px;
  color: white;
  font-size: 12px;
}

/* make close btn small */
.v-btn--icon {
  min-width: 32px;
  min-height: 32px;
  width: 32px;
  height: 32px;
  padding: 0;
}

.xml-textarea {
  font-family: monospace;
  white-space: pre-wrap;
  overflow-wrap: break-word;
}

/* Style for loading overlay */
.v-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: inherit;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex !important;
}

.avatar-name-display {
  padding: 8px 12px;
  border-radius: 4px;
  border-left: 3px solid #0099cc;
  background-color: rgba(0, 153, 204, 0.08);
}

.avatar-name-label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.7;
}

.avatar-name-value {
  margin: 0;
  font-weight: 700;
}
</style>