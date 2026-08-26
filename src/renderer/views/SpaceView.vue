<template>
  <div style="width: 100%; height: 100%; display: flex; flex-direction: column;">
    <embed 
      v-if="preloader" 
      class="gameFrame" 
      style="flex: 1; width: 100%; height: 100%; display: block;" 
      type="application/x-shockwave-flash" 
      :src="preloader" 
      id="Main" 
      name="Main"
      :flashvars="flashvars"
      allowScriptAccess="always"
      allowFullScreen="true"
      wmode="direct"
      bgcolor="#e1e1e1"
    />
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import router from '@/router';
import axios from 'axios';
import { useAuthStore} from '@/stores/auth.js';
import { useMeta } from 'vue-meta';

export default defineComponent({
  name: 'SpaceView',
  setup () {
    // useMeta() may only be called during setup(). The previous code re-called it
    // from a watcher on useActiveMeta(), which threw "No manager or current
    // instance" and aborted the component before the Flash embed could render.
    const metaManager = useMeta({ title: 'Loading Space...',
      description: 'SmallWorlds'
     });
    return {
      metaManager,
    };
  },
  data() {
    return {
      preloader: null,
      flashvars: null,
      url: router.currentRoute.value.path,
      spaceId: router.currentRoute.value.params.id,
      spaceName: null,
      spaceDesc: null,
      home: false,
      type: null,
      count: 0,
    };
  },
  methods: {
    //update header url when onload is called
    frameChange() {
      this.$emit(
        'updateHeader', //get url from iframe
        this.url
      );
    },

    async getSpaceData(spaceId) {
     try {
        const auth = useAuthStore();
        const response = await axios.get('/api/space/config/' + spaceId, {
          headers: {
            'SWSID': auth.session.SWSID,
          }
        });
        const data = response.data;
        this.preloader = data.preloader;
        this.flashvars = data.flashvars;
        // Handle the response data
      } catch (error) {
        console.error('Error fetching space data:', error);
      }
    },

    async getSpaceName(spaceId) {
      //does url have home in it or space? if has home then set home to true
      if (this.url.includes('home')) {
        this.home = true;
        this.type = 'home';
      }
      this.type = 'space';

      const response = await fetch(
        '/api/space/name/' + this.type + '/' + spaceId
      );
      const data = await response.json();
      
      this.spaceName = data.name || 'Unknown Space';
      this.spaceDesc = data.desc ? data.desc.toString() : 'No description available.';
      this.spaceId = router.currentRoute.value.params.id;
      // update meta title

      if (this.metaManager) {
        this.metaManager.title = this.spaceName + ' | SmallWorlds'.toString();
        this.metaManager.description = this.spaceDesc;
      }


      await window.rpc.setRPC({
        details: 'At ' + this.spaceName,
        state: this.spaceDesc,
        largeImageKey: 'logo',
        largeImageText: 'SmallWorlds',
        startTimestamp: Date.now(),
        // show buttons go there
        buttons: [
          {
            label: 'Go there',
            // app link
            url: 'swx://' + this.spaceId,
          },
        ],
      });
  },
},
  async mounted() {
    console.log('SpaceView mounted! Space ID:', router.currentRoute.value.params.id);
    this.spaceId  = router.currentRoute.value.params.id;
    try {
      await this.getSpaceName(this.spaceId);
    } catch (e) {
      console.error('Error in getSpaceName:', e);
    }
    try {
      await this.getSpaceData(this.spaceId);
    } catch (e) {
      console.error('Error in getSpaceData:', e);
    }
  },

  //listen for when iframe url changes
  watch: {
    url() {
      this.frameChange();
    },
  },
});
</script>
