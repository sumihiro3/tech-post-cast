<template lang="pug">
  v-btn(v-if="!liff.isLoggedIn()", color="primary", dark, @click="login")
    | LINEでログイン
</template>

<script setup lang="ts">
import { useNuxtApp } from '#app';

const nuxtApp = useNuxtApp();
const liff = nuxtApp.$liff;

/**
 * Initiates the LINE login process.
 *
 * @returns {void}
 */
const login = (): void => {
  if (!liff.isLoggedIn()) {
    liff.login();
  }
  else {
    alert('すでにログイン済みです。');
  }
};
</script>

<style scoped>
.login-button {
  padding: 10px 20px;
  font-size: 16px;
  color: white;
  background-color: #00C300;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}
</style>
