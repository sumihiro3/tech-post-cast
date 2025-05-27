<template lang="pug">
  v-app
    Header(:show-drawer-toggle="true" @toggle-drawer="toggleDrawer")
    v-navigation-drawer(
      v-model="drawer"
      color="white"
      :width="240"
      :mini-variant="!drawer"
      mini-variant-width="56"
    )
      v-list(nav dense)
        v-list-item(
          v-for="(item, i) in menuItems"
          :key="i"
          :to="item.to"
          :prepend-icon="item.icon"
          :title="item.title"
          color="primary"
        )
    v-main
      v-container(fluid :class="{'pl-0 pr-0': $vuetify.display.mdAndUp && drawer}")
        slot.ma-0.pa-0
    Footer
</template>

<script setup lang="ts">
useHead({
  link: [
    {
      rel: 'preconnect',
      href: 'https://fonts.googleapis.com',
    },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Roboto&display=swap',
      crossorigin: '',
    },
  ],
});

const drawer = ref(true);

const menuItems = [
  { title: 'ダッシュボード', icon: 'mdi-view-dashboard', to: '/app/dashboard' },
  // { title: 'パーソナライズ番組の配信一覧', icon: 'mdi-television-play', to: '/app/broadcasts' },
  { title: 'パーソナライズ番組設定', icon: 'mdi-cog', to: '/app/feeds' },
  { title: 'ユーザー設定', icon: 'mdi-account-cog', to: '/app/settings' },
  // { title: 'サブスクリプション一覧', icon: 'mdi-credit-card-outline', to: '/app/subscriptions' },
  // { title: 'ユーザー情報', icon: 'mdi-account', to: '/app/profile' },
];

const toggleDrawer = (): void => {
  drawer.value = !drawer.value;
};
</script>

<style lang="css">
a {
  text-decoration: none;
}
a:hover {
  text-decoration: underline;
}
a:link {
  color: #212121;
}
a:visited {
  color: #757575;
}
</style>
