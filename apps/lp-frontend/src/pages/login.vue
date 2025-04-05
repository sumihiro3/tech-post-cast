<template lang="pug">
v-container
  SignIn
</template>

<script setup lang="ts">
import { SignedIn, SignIn } from '@clerk/vue';

const { userId } = useAuth();
console.log(`userID: ${userId.value}`);
console.log(`SignedIn: ${SignedIn}`);
if (SignedIn) {
  // ログイン状態であれば、リンク元にリダイレクト
  const redirectUrl = new URL(window.location.href);
  if (redirectUrl) {
    navigateTo(redirectUrl);
  }
  else {
    navigateTo('/app/dashboard');
  }
}
else {
  navigateTo('/');
}
</script>
