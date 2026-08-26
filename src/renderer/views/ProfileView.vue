<template>
  <CurrencyHeader />
  <Profile />
</template>

<script>
import { defineComponent } from 'vue';

// Components
import Profile from '@components/Profile.vue';
import CurrencyHeader from '@components/CurrencyHeader.vue';

// OnlineHeader was removed from this view: it repeated the online count and
// clock that the profile panel's own header already shows, and its "Select
// Avatar" / "Select Space" labels were captions for sections that are now
// self-evident.

export default defineComponent({
  name: 'ProfileView',

  components: {
    CurrencyHeader,
    Profile,
  },
  emits: ['triggerDialog'],
});
</script>
