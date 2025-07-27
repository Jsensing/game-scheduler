import { getApp, getApps, initializeApp } from 'firebase/app';
import { getFirestore, initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBGUPZYreAxv3DJ11bIxmoSvt993-V9VkY',
  authDomain: 'game-scheduler-7483d.firebaseapp.com',
  projectId: 'game-scheduler-7483d',
  storageBucket: 'game-scheduler-7483d.appspot.com',
  messagingSenderId: '298701316276',
  appId: '1:298701316276:android:a6267a1f7bf604d786f7e1',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const db =
  getFirestore(app) ??
  initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });

export { db };

