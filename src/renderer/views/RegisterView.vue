<template>
  <RegisterC />
</template>

<script>
import { defineComponent } from 'vue';
import { useMeta } from 'vue-meta';
import RegisterC from '@components/RegisterC.vue';

export default defineComponent({
  name: 'RegisterView',
  setup() {
    useMeta({ title: 'Create Account' });
  },
  components: {
    RegisterC,
  },
});
</script>
