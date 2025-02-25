<template lang="pug">
v-container
  v-row(v-if="profile")
    v-col(cols="12")
      v-card
        v-card-title
          h2
            | プロフィール
        v-card-text
          v-row
            v-col(cols="12")
              v-avatar(size="100")
                v-img(:src="profile.pictureUrl")
            v-col(cols="12")
              h3
                | {{ profile.displayName }}
            v-col(cols="12")
              h4
                | {{ profile.statusMessage }}
</template>

<script setup lang="ts">
import { useNuxtApp } from '#app';

const nuxtApp = useNuxtApp();
const liff = nuxtApp.$liff;

const profile = await liff.getProfile();
console.log(profile);
</script>
