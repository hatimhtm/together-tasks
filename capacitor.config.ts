import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.togethertasks.app',
  appName: 'Together Tasks',
  webDir: 'out',
  server: {
    url: 'https://together-tasks-six.vercel.app/',
    cleartext: true
  }
};

export default config;
