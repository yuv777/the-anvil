import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'app.theanvil',
  appName: 'The Anvil',
  webDir: 'public',
  server: {
    // Replace with your actual Vercel URL
    url: 'https://the-anvil-seven.vercel.app',
    cleartext: false,
  },
  plugins: {
    StatusBar: {
      style: 'Dark',
      backgroundColor: '#080808',
      overlaysWebView: false,
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#080808',
      showSpinner: false,
      androidSplashResourceName: 'splash',
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
}

export default config
