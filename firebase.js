import { getApp, getApps, initializeApp } from 'firebase/app';
import { getFirestore, initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {

};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const db =
  getFirestore(app) ??
  initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });

export { db };

