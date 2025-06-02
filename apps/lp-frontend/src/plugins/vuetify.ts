// import this after install `@mdi/font` package
import '@mdi/font/css/materialdesignicons.css';
import { createVuetify, type ThemeDefinition } from 'vuetify';
import 'vuetify/styles';
import '~/styles/main.scss';

const techPostCastLightTheme: ThemeDefinition = {
  colors: {
    background: '#F5F6F6',
    primary: '#55C500',
    secondary: '#2B6300',
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
    ssr: true,
    defaults: {
      VNavigationDrawer: {
        temporary: false,
        permanent: true,
      },
    },
  });
  app.vueApp.use(vuetify);
});
