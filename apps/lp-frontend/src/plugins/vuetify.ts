// import this after install `@mdi/font` package
import '@mdi/font/css/materialdesignicons.css';
import { createVuetify, type ThemeDefinition } from 'vuetify';
import colors from 'vuetify/lib/util/colors.mjs';
import 'vuetify/styles';

const techPostCastLightTheme: ThemeDefinition = {
  colors: {
    background: '#F4F4F4',
    primary: '#472AB2',
    secondary: colors.teal.darken1, // #26A69A
    anchor: '#8c9eff',
  },
};

export default defineNuxtPlugin((app) => {
  const vuetify = createVuetify({
    theme: {
      defaultTheme: 'techPostCastLightTheme',
      themes: {
        techPostCastLightTheme,
      },
    },
  });
  app.vueApp.use(vuetify);
});
