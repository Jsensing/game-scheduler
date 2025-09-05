import 'dotenv/config';

export default {
  expo: {
    name: 'game-scheduler',
    slug: 'game-scheduler',
    version: '1.0.0',
    orientation: 'portrait',
    updates: {
      fallbackToCacheTimeout: 0,
      url: 'https://u.expo.dev/43e81f0e-201e-45a3-9165-72186c708d62'
    },
    runtimeVersion: {
      policy: 'appVersion'
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true
    },
    android: {
      package: 'com.wraith176.gamescheduler'
    },
    extra: {
      USE_DEV_COLLECTION: false,
      eas: {
        projectId: '43e81f0e-201e-45a3-9165-72186c708d62'
      }
    },
    plugins: ['expo-router'] // ✅ REQUIRED for expo-router to function correctly
  }
};
