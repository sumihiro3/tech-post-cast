<template lang="pug">
v-card(elevation="2" class="section-card")
  v-card-title.d-flex.align-center(v-if="title || $slots.title")
    v-icon.mr-2(v-if="icon") {{ icon }}
    slot(name="title")
      | {{ title }}
    v-spacer
    slot(name="actions")
  v-divider(v-if="showDivider")
  slot
</template>

<script setup lang="ts">
interface Props {
  title?: string;
  icon?: string;
  showDivider?: boolean;
}

withDefaults(defineProps<Props>(), {
  title: '',
  icon: '',
  showDivider: true,
});
</script>

<style scoped>
.section-card {
  border-radius: 12px;
}
</style>
