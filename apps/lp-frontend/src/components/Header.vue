<template lang="pug">
v-container(fluid)
  v-app-bar
    template(#prepend)
      a(href='/')
        logo
    //- template(#append)
    //-   v-btn.ms-6.me-2(
    //-     color='primary',
    //-     icon='mdi-magnify',
    //-     variant='elevated',
    //-     text='Signup'
    //-   )
</template>

<script lang="ts" setup>
import { useDisplay } from 'vuetify';
const { mobile } = useDisplay();
</script>
