<template>
  <div>
    <h1>Post {{ program?.id }}</h1>
    <h2>Post {{ program?.title }}</h2>
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
const { $apiV1 } = useNuxtApp();
const { id } = useRoute().params;
const programId = Array.isArray(id) ? id[0] : id;

const apiBaseUrl = 'http://localhost:3000';
const apiKey = 'test-v1-api-key';

type Program = {
  id: string;
  title: string;
};

// const program = ref<Program | null>(null);
const {
  data: program,
  pending,
  error,
  refresh,
} = await useAsyncData<HeadlineTopicProgramDto>(
  `program:${programId}`,
  async () => {
    const { data: dto } = await $apiV1.getHeadlineTopicProgram(
      programId,
      apiKey,
    );
    return {
      id: programId,
      title: dto.title!,
    };
  },
  // $fetch<Program>(`${apiBaseUrl}/api/v1/headline-topic-programs/${id}`, {
  //   method: 'GET',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'x-api-key': apiKey,
  //   },
  // }),
);
</script>
