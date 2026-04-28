import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications should be displayed
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Register for push notifications and get the push token
 * @returns Push token string or null if registration fails
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  try {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    console.log('Is physical device:', Device.isDevice); // Add this

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      console.log('Existing permission status:', existingStatus); // Add this
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      console.log('Final permission status:', finalStatus); // Add this

      if (finalStatus !== 'granted') {
        console.warn('Push notification permission not granted');
        return null;
      }

      console.log('Project ID:', Constants.expoConfig?.extra?.eas?.projectId); // Add this

      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        })
      ).data;

      console.log('Token generated:', token); // Add this
    } else {
      console.warn('Must use physical device for push notifications');
    }

    return token ?? null;
  } catch (error) {
    console.error('Push notification registration failed:', error);
    return null;
  }
}