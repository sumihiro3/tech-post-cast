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

</template>

<script setup lang="ts">
// プロパティ定義
const props = defineProps({
  showDrawerToggle: {
    type: Boolean,
    default: false,
  },
});

// ドロワー切り替えイベントを定義
const emit = defineEmits(['toggle-drawer']);
</script>
