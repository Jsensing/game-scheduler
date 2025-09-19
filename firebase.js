import Constants from 'expo-constants';
import { getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const {
  API_KEY,
  AUTH_DOMAIN,
  PROJECT_ID,
  STORAGE_BUCKET,
  MESSAGING_SENDER_ID,
  APP_ID,
  USE_DEV_COLLECTION,
} = Constants.expoConfig?.extra || {};

const firebaseConfig = {
  apiKey: API_KEY,
  authDomain: AUTH_DOMAIN,
  projectId: PROJECT_ID,
  storageBucket: STORAGE_BUCKET,
  messagingSenderId: MESSAGING_SENDER_ID,
  appId: APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
console.log(`✅ Firebase initialized (${USE_DEV_COLLECTION ? 'events_dev' : 'events'})`);

const db = getFirestore(app);
export { app, db };

