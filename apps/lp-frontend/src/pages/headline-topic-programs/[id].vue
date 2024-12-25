<template>
  <div>
    <h1>Program {{ program?.id }}: {{ program?.title }}</h1>
    <v-btn
      append-icon="mdi-account-circle"
      prepend-icon="mdi-check-circle"
      to="/"
    >
      <template v-slot:prepend>
        <v-icon color="success"></v-icon>
      </template>

      Go to homepage Button

      <template v-slot:append>
        <v-icon color="warning"></v-icon>
      </template>
    </v-btn>
    <div>{{ program }}</div>
    <div v-if="error">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import type { HeadlineTopicProgramDto } from '@/api';

definePageMeta({
  // validate: async (route) => {
  //   const id = Number(route.params.id);
  //   // Check if the id is made up of digits
  //   return !(id > 100);
  // },
});
const { $apiV1, $config } = useNuxtApp();
const apiAccessToken = $config.public.apiAccessToken;
const route = useRoute();
const { id } = route.params;
const programId = Array.isArray(id) ? id[0] : id;

const { data: program, error } = await useAsyncData<HeadlineTopicProgramDto>(
  `program:${programId}`,
  async () => {
    const { data: dto } = await $apiV1.getHeadlineTopicProgram(
      programId,
      apiAccessToken,
    );
    return {
      id: programId,
      title: dto.title!,
    };
  },
);
</script>
