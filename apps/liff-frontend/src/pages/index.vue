<template>
  <div>
    <LineLoginButton />
    <LineProfile />
    <NuxtLink to="listener-letters">Letter</NuxtLink>
  </div>
</template>

<script setup lang="ts">
import LineLoginButton from '~/components/line-login-button.vue';
import LineProfile from '~/components/profile.vue';
</script>
