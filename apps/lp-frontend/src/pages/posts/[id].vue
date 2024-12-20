<script setup lang="ts">
definePageMeta({
  validate: async (route) => {
    const id = Number(route.params.id)
    // Check if the id is made up of digits
    return !(id > 100)
  }
})

const route = useRoute()

// When accessing /posts/1, route.params.id will be 1
console.log(route.params.id)
</script>

<template>
  <div>
    <h1>Post {{ route.params.id }}</h1>
    
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
  </div>
</template>
