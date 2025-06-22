<template lang="pug">
  v-app
    Header(:show-drawer-toggle="true" @toggle-drawer="toggleDrawer")
    ClientOnly
      v-navigation-drawer(
        v-model="drawer"
        app
        color="white"
        :width="240"
        :temporary="$vuetify.display.mobile"
        :permanent="!$vuetify.display.mobile"
        :mini-variant="$vuetify.display.mobile ? false : !drawer"
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
            :active="isMenuItemActive(item)"
          )
      template(#fallback)
        // サーバーサイドレンダリング時のフォールバック
        div
    v-main
      v-container(fluid :class="{'pl-0 pr-0': $vuetify.display.mdAndUp && drawer && !$vuetify.display.mobile}")
        slot.ma-0.pa-0
    Footer.mt-10
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { useDisplay } from 'vuetify';

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

// レスポンシブ対応：モバイルでは初期状態で閉じる
const { mobile } = useDisplay();
const drawer = ref(!mobile.value);
const route = useRoute();

interface MenuItem {
  title: string;
  icon: string;
  to: string;
  exact?: boolean;
}

const menuItems: MenuItem[] = [
  { title: 'ダッシュボード', icon: 'mdi-view-dashboard', to: '/app/dashboard' },
  { title: 'パーソナルフィード設定', icon: 'mdi-rss', to: '/app/feeds', exact: false },
  { title: 'パーソナルプログラム', icon: 'mdi-podcast', to: '/app/programs', exact: false },
  { title: 'ユーザー設定', icon: 'mdi-account-cog', to: '/app/settings' },
  // { title: 'サブスクリプション一覧', icon: 'mdi-credit-card-outline', to: '/app/subscriptions' },
];

const toggleDrawer = (): void => {
  drawer.value = !drawer.value;
};

const isMenuItemActive = (item: MenuItem): boolean => {
  const currentPath = route.path;

  // exactがfalseの場合は、パスが始まっているかをチェック
  if (item.exact === false) {
    return currentPath.startsWith(item.to);
  }

  // デフォルトは完全一致
  return currentPath === item.to;
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
