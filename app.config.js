// Import dotenv to load environment variables from .env file
// This allows sensitive configuration to be kept out of version control
import 'dotenv/config';

/**
 * Expo app configuration file (app.config.js)
 * Defines all settings for the React Native app including:
 * - App metadata (name, version, slug)
 * - Platform-specific settings (iOS, Android)
 * - Over-the-air (OTA) update configuration
 * - Custom environment variables
 * - Required plugins
 */
export default {
  expo: {
    // App display name shown on the home screen
    name: 'game-scheduler',
    
    // URL-friendly identifier used in Expo services
    slug: 'game-scheduler',
    
    // App version number (increment for each release)
    version: '1.0.0',

    //app icon
    icon: './assets/images/appIcon.png',
    
    // Lock app to portrait orientation only
    orientation: 'portrait',
    
    /**
     * Over-the-air (OTA) update configuration
     * Allows pushing updates without going through app stores
     */
    updates: {
      // Time in ms to wait for update before falling back to cached version
      // 0 means always use cached version immediately while checking for updates in background
      fallbackToCacheTimeout: 0,
      
      // URL where the app checks for OTA updates
      // This is your EAS Update URL from Expo
      url: 'https://u.expo.dev/43e81f0e-201e-45a3-9165-72186c708d62'
    },
    
    /**
     * Runtime version policy
     * 'appVersion' means runtime version matches the app version
     * Updates are only compatible if runtime versions match
     */
    runtimeVersion: {
      policy: 'appVersion'
    },
    
    // Pattern matching all assets to include in the app bundle
    assetBundlePatterns: ['**/*'],
    
    /**
     * iOS-specific configuration
     */
    ios: {
      // Enable iPad support (app works on both iPhone and iPad)
      supportsTablet: true
    },
    
    /**
     * Android-specific configuration
     */
    android: {
      // Unique package identifier for the Android app
      // Format: com.yourcompany.appname
      package: 'com.wraith176.gamescheduler',
      userInterfaceStyle: "light"
    },

    userInterfaceStyle: "light",
    
    /**
     * Custom configuration values accessible in the app
     * These values can be accessed via Constants.expoConfig.extra
     */
    extra: {
      // Toggle between development and production Firestore collections
      // false = use production 'events' collection
      // true = use development 'events_dev' collection
      USE_DEV_COLLECTION: false,
      
      /**
       * EAS (Expo Application Services) configuration
       */
      eas: {
        // Project identifier for EAS services (builds, updates, submit)
        projectId: '43e81f0e-201e-45a3-9165-72186c708d62'
      }
    },
    
    /**
     * Expo plugins to enable additional functionality
     * expo-router: Required for file-based routing to work correctly
     */
    plugins: ['expo-router'] // REQUIRED for expo-router to function correctly
  }
};