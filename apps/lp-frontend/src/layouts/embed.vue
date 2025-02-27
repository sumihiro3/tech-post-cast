<template lang="pug">
v-app
  v-main
    v-container.ma-0.pa-0(fluid)
      slot.ma-0.pa-0
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
