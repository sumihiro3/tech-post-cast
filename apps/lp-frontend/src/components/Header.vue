<template lang="pug">
v-container(fluid)
  v-app-bar
    template(#prepend)
      a(href='/')
        logo
      v-app-bar-nav-icon.ml-2(
        v-if="props.showDrawerToggle"
        @click="emit('toggle-drawer')"
      )
    ClientOnly
      template(#default)
        SignedOut
          v-btn(
            color="primary"
            variant="elevated"
            prepend-icon="mdi-login"
            class="ml-2"
            @click="signIn"
          ) ログイン
        SignedIn
          v-menu(location="bottom end")
            template(#activator="{ props: signInProps }")
              v-btn(
                icon
                v-bind="signInProps"
                class="ml-2"
              )
                v-avatar
                  v-img(
                    :src="user?.imageUrl"
                    :alt="user?.fullName || 'ユーザーアバター'"
                  )
            v-list
              v-list-item(
                to="/app/dashboard"
                prepend-icon="mdi-view-dashboard"
                title="ダッシュボード"
                @click="closeMenu"
              )
              v-list-item(
                prepend-icon="mdi-logout"
                title="ログアウト"
                @click="signOut"
              )
      template(#fallback)
        //- SSGビルド時やクライアントサイド初期化前のフォールバックUI
        v-btn(
          color="primary"
          :loading="true"
          disabled
        ) 読み込み中...
</template>

<script setup lang="ts">
import { SignedIn, SignedOut, useClerk, useUser } from '@clerk/vue';

// プロパティ定義
const props = defineProps({
  showDrawerToggle: {
    type: Boolean,
    default: false,
  },
});

const clerk = useClerk();
const { user } = useUser();

const signIn = (): void => {
  clerk.value?.openSignIn();
};

const signOut = (): void => {
  clerk.value?.signOut();
};

const closeMenu = (): void => {
  // メニューを閉じる処理はv-menuコンポーネントが自動的に行います
};

// ドロワー切り替えイベントを定義
const emit = defineEmits(['toggle-drawer']);
</script>
