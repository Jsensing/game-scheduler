import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Replace these with your actual Firebase project config
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'your-app.firebaseapp.com',
  projectId: 'your-app-id',
  storageBucket: 'your-app.appspot.com',
  messagingSenderId: 'YOUR_MESSAGING_ID',
  appId: 'YOUR_APP_ID',
};

const app = initializeApp(firebaseConfig);

// Export Auth and Firestore instances
export const auth = getAuth(app);
export const db = getFirestore(app);
