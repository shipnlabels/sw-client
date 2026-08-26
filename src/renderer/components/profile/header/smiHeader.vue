<template>
  <v-list-item
    :prepend-avatar="user.$state.defaultAvatar?.thumbUrl"
    :title="user.$state.firstName + space + user.$state.lastName"
  ></v-list-item>
  <!-- add user gold + tokens -->
  <!-- align center -->
  <v-list-item>
    <v-chip color="yellow" style="float: left">
      <v-img src="balance_gold.png" height="20" width="20"></v-img>
      {{ commas(user.$state.goldBalance) }}
    </v-chip>
    <v-chip color="orange" style="float: right">
      <v-img src="balance_token.png" height="20" width="20"></v-img>
      {{ commas(user.$state.tokensBalance) }}
    </v-chip>
  </v-list-item>

  <v-divider></v-divider>
</template>

<script>
export default {
name: 'smiHeader',
props: {
  user: {
    type: Object,
    required: true,
  },
},
data: () => ({
  space: ' ',
}),
emits: ['getCurrentRoutes'],
methods : {
  getCurrentRoutes() {
    this.$emit('getCurrentRoutes');
  },
  commas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  },
},
}
</script>