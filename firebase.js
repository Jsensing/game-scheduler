import Constants from 'expo-constants';
import { getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

/**
 * Extract Firebase configuration values from Expo's app.json/app.config.js
 * These values are stored in the 'extra' field for security and environment management
 * 
 * Configuration includes:
 * - Firebase project credentials (API key, project ID, etc.)
 * - USE_DEV_COLLECTION flag to toggle between production and development collections
 */
const {
  API_KEY,                  // Firebase API key for authentication
  AUTH_DOMAIN,              // Firebase authentication domain
  PROJECT_ID,               // Firebase project identifier
  STORAGE_BUCKET,           // Firebase storage bucket URL
  MESSAGING_SENDER_ID,      // Firebase Cloud Messaging sender ID
  APP_ID,                   // Firebase app identifier
  USE_DEV_COLLECTION,       // Boolean flag to determine which Firestore collection to use
} = Constants.expoConfig?.extra || {};

/**
 * Firebase configuration object
 * Contains all necessary credentials to connect to Firebase services
 */
const firebaseConfig = {
  apiKey: API_KEY,
  authDomain: AUTH_DOMAIN,
  projectId: PROJECT_ID,
  storageBucket: STORAGE_BUCKET,
  messagingSenderId: MESSAGING_SENDER_ID,
  appId: APP_ID,
};

/**
 * Initialize Firebase app
 * Checks if an app instance already exists to prevent multiple initializations
 * This is important for hot reloading during development
 */
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

/**
 * Log which collection environment is being used
 * Helps developers verify they're using the correct database (dev vs production)
 */
console.log(`✅ Firebase initialized (${USE_DEV_COLLECTION ? 'events_dev' : 'events'})`);

/**
 * Get Firestore database instance
 * This will be used throughout the app for all database operations
 */
const db = getFirestore(app);

// Export Firebase app instance and Firestore database for use in other files
export { app, db };
