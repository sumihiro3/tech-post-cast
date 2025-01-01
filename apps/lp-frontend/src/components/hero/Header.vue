<template>
  <v-card theme="dark" color="#0d2141">
    <v-layout class="fill-height">
      <v-app-bar color="transparent" flat height="96">
        <template v-if="mdAndUp" #prepend>
          <logo />
        </template>

        <template #append>
          <div v-if="mdAndUp">
            <v-btn text="Home" />

            <v-btn text="About us" />

            <v-btn text="Portfolio" />

            <v-btn text="Services" />

            <v-btn text="Contact" />
          </div>

          <v-btn
            class="ms-6 me-2"
            color="primary"
            size="large"
            text="Signup"
            variant="elevated"
            width="128"
          />

          <v-btn
            class="mx-2"
            size="large"
            text="Login"
            variant="outlined"
            width="128"
          />
        </template>
      </v-app-bar>

      <v-main>
        <v-container class="py-16 px-12">
          <v-row align="center">
            <v-col cols="12" md="6">
              <h1 class="text-h3 mb-4">
                Design means

                <br />

                <strong>Business_</strong>
              </h1>

              <div class="text-medium-emphasis text-body-2 mb-12">
                Share your knowledge and learn from others. Join the community
                and grow with us. We are here to help you.
              </div>

              <v-btn color="primary" size="large" text="Get Started for Free" />
            </v-col>

            <v-col cols="12" md="6">
              <v-img
                src="@/assets/heroheaders/heroheaders2.png"
                class="d-none d-md-block"
              />
            </v-col>
          </v-row>
        </v-container>
      </v-main>
    </v-layout>
  </v-card>
</template>

<script lang="ts" setup>
import { useDisplay } from 'vuetify';

const { mdAndUp } = useDisplay();
</script>
