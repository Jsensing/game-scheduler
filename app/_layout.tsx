import { Stack } from 'expo-router';
import { getApps, initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBGUPZYreAxv3DJ11bIxmoSvt993-V9VkY',
  authDomain: 'game-scheduler-7483d.firebaseapp.com',
  projectId: 'game-scheduler-7483d',
  storageBucket: 'game-scheduler-7483d.appspot.com',
  messagingSenderId: '298701316276',
  appId: '1:298701316276:android:a6267a1f7bf604d786f7e1',
};

if (!getApps().length) {
  const app = initializeApp(firebaseConfig);
  initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });
  console.log('✅ Firebase initialized');
}

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Game Scheduler' }} />
    </Stack>
  );
}
