<template>
  <v-app>
    <v-main>
      <v-container fluid>
        <slot />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import VConsole from 'vconsole';
const runtimeConfig = useRuntimeConfig();
const NODE_ENV = runtimeConfig.public.NODE_ENV;
const LOG_LEVEL = runtimeConfig.public.LOG_LEVEL;

onMounted(async () => {
  console.log(`NODE_ENV: ${NODE_ENV}`);
  if (NODE_ENV === 'development' || LOG_LEVEL === 'DEBUG') {
    const vConsole = new VConsole();
    console.log(`VConsole enabled: ${vConsole.version}`);
  }
});
</script>
