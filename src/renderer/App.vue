<template>
  <metainfo>
    <template v-slot:title="{ content }">{{ content ? `${content} | SmallWorlds` : `SmallWorlds` }}</template>
  </metainfo>
  <v-app theme="dark" full-height>
    <headerComponent />
    <v-main style="height:100%;" class="profile-container">
      <router-view :key="$route.fullPath" @triggerSnackbar="triggerSnackbar" />
      <snackBar :snackbar="snackbar" />
    </v-main>   
  </v-app>
</template>

<script>
import { useMeta } from 'vue-meta'
import { reactive } from 'vue';
import headerComponent from './components/HeaderComponent.vue';
import snackBar from './components/utils/snackBar.vue';
export default {
  name: 'App',
  components: {
    headerComponent,
    snackBar,
  },
  setup () {
    const snackbar = reactive({
      visible: false,
      text: '',
      color: '',
      icon: '',
      timeout: 3000,
      offset: 0,
    });

    useMeta({
      title: '',
      htmlAttrs: { lang: 'en', amp: true }
    });

    return { snackbar };
  },

  methods: {
    triggerSnackbar(data) {
      this.snackbar.visible = data.visible;
      this.snackbar.text = data.text;
      this.snackbar.color = data.color;
      this.snackbar.icon = data.icon;
      this.snackbar.timeout = data.timeout || 3000;
      this.snackbar.offset = data.offset || 0;
      this.snackbar.variant = data.variant || 'tonal';
      setTimeout(() => {
        this.snackbar.visible = false;
      }, this.snackbar.timeout);
    },
    // eslint-disable-next-line no-console
    log(...args) {
      console.log(...args);
    },
    updateHeader(url) {
      this.$refs.headerComponent.updateHeader(url);
    },
  },
};
</script>
<style>
/* Global Styles */
::-webkit-scrollbar {
  display: none;
}
/* Page field behind the panels. The old tc_bg.png was a low-resolution
   screenshot stretched to full width, which read as a blurry smear behind
   everything. A flat graded field keeps the panels crisp and puts the focus
   on the content instead of a background photo. */
.profile-container {
  background: linear-gradient(180deg, #dfe7f2 0%, #cbd7e8 45%, #bccbe0 100%);
  background-attachment: fixed;
  height: 100%;
  color: #333;
}
#app {
  height: 100%;
  width: 100%;
  overflow: hidden;
}
:focus {
  outline: none;
}
.swCloseBtn {
  background: rgba(255, 0, 0, 0.732);
  color: white;
  /* make smaller */
  transition: background 0.3s;
  position: absolute;
    right: 8px;
    color: white;
    font-size: 12px;
  min-width: 24px;
  min-height: 24px;
  width: 24px !important;
  height: 24px !important;
  padding: 0;
}
.swBtn {
  /* Updated ok button gradient style */
  background: linear-gradient(135deg, #FF9800, #F57C00);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  text-transform: uppercase;
  padding: 10px 16px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.swPBtn{
  /* font color white */
  background: linear-gradient(135deg, #FF9800, #F57C00);
  color: white;
  border: none;
  border-radius: 20px;
  font-weight: bold;
  text-transform: uppercase;
  padding: 10px 16px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.swDrawer
{
  background: #578493f2;
  color: white;
  border: none;
  font-weight: bold;
  text-transform: uppercase;
  padding: 10px 16px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.v-btn--active {
  /* Make the text bold and the orange darker */
  font-weight: bold;
  background: linear-gradient(135deg, #FF9800, #F57C00) !important;
  border: 1px solid #fff !important;
  
}
.swIBtn {
  background: linear-gradient(135deg, #ff99009f, #f57b0098)  ;
  color: #ff9900 !important  ;
  border: none;
  font-weight: bold;
  text-transform: uppercase;
  padding: 10px 16px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.swBtn:hover {
  transform: scale(1.03);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.sw-dialog {
  width: 500px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  background: rgba(23, 176, 211, 0.9)
}

.sw-dialog-header {
  position: relative;
  background: rgba(20,149,179,0.9);
  color: white;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  /* padding: 10px; */
  border-bottom: 3px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.sw-dialog-content {
  padding: 20px;
}

.sw-dialog-actions {
  padding: 16px;
  display: flex;
  gap: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.1);
  background: rgba(20,149,179,0.8);

}
</style>
