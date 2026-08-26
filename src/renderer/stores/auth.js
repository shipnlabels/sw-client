import { defineStore } from 'pinia';
import axios from 'axios';
import { useUserStore } from '@/stores/user.js';
// import { useRouter } from 'vue-router';
import base64 from 'base-64';
import { reactive } from 'vue';

export const useAuthStore = defineStore({
  id: 'auth',
  
   state: () =>
    {
      const initialState = reactive({
      email: null,
      isLoggedIn: false,
      token: null,
      primaryGroupId: null,
      secondaryGroupIds: null,
      session: null,
    });
   window.storage.getItem('AUTH_STATE').then((value) => {
      if (value) {
        const storedAuthInfo = JSON.parse(value);
        for (const key in storedAuthInfo) {
          initialState[key] = storedAuthInfo[key];
        }
      }
    });

    return initialState;
    
    },

  actions: {
    async initialize()
    {
      const raw = await window.storage.getItem('AUTH_STATE');
      let storedAuthInfo = {};
      try {
        // guard: getItem can return undefined/'undefined'/corrupt JSON, and a
        // throw here aborts the router guard that awaits this.
        if (raw && raw !== 'undefined') storedAuthInfo = JSON.parse(raw) || {};
      } catch (e) {
        console.error('Could not parse AUTH_STATE, ignoring:', e);
        storedAuthInfo = {};
      }
      // only overwrite fields that are actually present — a failed/empty read
      // must not clobber a valid in-memory session and log the user out.
      for (const key of ['email','isLoggedIn','token','primaryGroupId','secondaryGroupIds','session']) {
        if (storedAuthInfo[key] !== undefined) this[key] = storedAuthInfo[key];
      }
    },
    updateState(data) {
      let newAuthState = { ...this.$state, ...data };
      window.storage.removeItem('AUTH_STATE');
      window.storage.setItem('AUTH_STATE', JSON.stringify(newAuthState));
      this.$reset();
    },

    async loginWithToken(token) {
      try {
        const { data } = await axios.post('/api/auth/token', {
          token,
        });
        // send swsid to axios
        axios.defaults.headers.common['swsid'] = token;
        const user = useUserStore();
        if (data.success) {
          this.updateState({
            email: data.user.email,
            isLoggedIn: true,
            token: data.api,
            primaryGroupId: data.user.primaryGroupId,
            secondaryGroupIds: data.user.secondaryGroupIds,
            session: data.SWSID,
          });
          await user.storeInfo(data);
          return true;
        }
      }
      catch (error) {
        console.error(error);
        throw error;
      }
    },

    async login({ email, password }) {
      try {
        let token = base64.encode(`${email}:${password}`);
        const { data } = await axios.post('/api/auth/login', {
          email,
          password,
        },
       // send authorization header to axios
       
        axios.defaults.headers.common['Authorization'] = `Basic ${token}`,
        
        );
        const user = useUserStore();
        if (data.success) {
          // this.commit('setAuthUser', data);
          this.updateState({
            email: data.user.email,
            isLoggedIn: true,
            token: data.api,
            primaryGroupId: data.user.primaryGroupId,
            secondaryGroupIds: data.user.secondaryGroupIds,
            session: data.SWSID,
          });
          await user.storeInfo(data);
          return true;
        } else throw new Error('Bad credentials');
      } catch (error) {
        if (error.response && error.response.status === 401) {
          throw new Error('Bad credentials');
        }
        console.error(error);
        throw error;
      }
    },
    async logout() {
      const user = useUserStore();

      try {
        // const router = useRouter();
        // add authorization header to axios
        let token = this.$state.token;
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        await axios.post('/api/auth/logout');
        window.storage.removeItem('AUTH_STATE');
        window.storage.removeItem('USER_INFO');
        this.$reset();
        user.$reset();
        // router.push('/login');
        window.location.href = '/login';
      } catch (error) {
        console.log(error.response);
        // if error.message is "Invalid credentials." then the user is already logged out
        if (error.response.data.message === "Invalid credentials.") {
          window.storage.removeItem('AUTH_STATE');
          window.storage.removeItem('USER_INFO');
          this.$reset();
          user.$reset();
          // router.push('/login');
          window.location.href = '/login';
        }
        // const router = useRouter();
        console.error(error);
        // window.location.href = '/#/login';
      }
    },
    async register({ commit }, { username, password }) {
      try {
        const { data } = await axios.post('/api/register', {
          username,
          password,
        });
        commit('setAuthUser', data);
      } catch (error) {
        if (error.response && error.response.status === 401) {
          throw new Error('Bad credentials');
        }
        throw error;
      }
    },
  },

  // getters: {
  //   isLoggedIn: (state) => state.isLoggedIn,
  //   email: (state) => state.email,
  //   token: (state) => state.token,
  // },

  mutations: {
    setAuthUser(state, user) {
      state.authUser = user;
    },
  },
});
