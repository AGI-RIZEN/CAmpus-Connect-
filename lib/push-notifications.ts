import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { registerPushToken } from './api/users';
import { storage } from './api/token-storage';

const PREFERENCE_KEY = 'cc_notifications_enabled';

/** Defaults to enabled (matches the Settings screen's prior always-on behavior) until the
 *  user explicitly flips the toggle. */
export async function getNotificationsPreference(): Promise<boolean> {
  const stored = await storage.getItem(PREFERENCE_KEY);
  return stored !== 'false';
}

export async function setNotificationsPreference(enabled: boolean): Promise<void> {
  await storage.setItem(PREFERENCE_KEY, String(enabled));
}

/** Clears the server-side token so this device stops receiving pushes — best-effort, same
 *  as registerForPushNotifications, since a failed unregister shouldn't block the UI. */
export async function unregisterPushNotifications(): Promise<void> {
  try {
    await registerPushToken('');
  } catch (err) {
    console.error('[push] unregister failed (non-fatal):', (err as Error).message);
  }
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/** Requests permission, grabs this device's Expo push token, and saves it on the logged-in
 *  user's account server-side. Best-effort throughout — a denied permission or a token/registration
 *  failure should never block the rest of the app from working. */
export async function registerForPushNotifications(): Promise<void> {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) return;

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await registerPushToken(token);
  } catch (err) {
    console.error('[push] registration failed (non-fatal):', (err as Error).message);
  }
}
