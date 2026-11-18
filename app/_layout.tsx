import '../global.css';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { ToastProvider } from '@/components/ui/Toast';
import { useColorScheme } from 'nativewind';
import { AuthProvider } from '@/lib/auth-context';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    // Default to light regardless of the device/browser's system theme —
    // the dark palette is opt-in via the Settings toggle, not automatic.
    setColorScheme('light');
  }, []);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  // Tapping a notice push (from the OS tray, or cold-launching the app via one) sends the
  // student straight to their in-app Notifications list — the same place the bell icon goes.
  // expo-notifications' response APIs aren't implemented on web (no OS notification tray there).
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const goToNotifications = (data: Record<string, unknown> | undefined) => {
      if (data?.type === 'notice') {
        router.push('/(app)/home/notifications');
      }
    };

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) goToNotifications(response.notification.request.content.data);
    });

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      goToNotifications(response.notification.request.content.data);
    });

    return () => subscription.remove();
  }, []);

  if (!fontsLoaded) return null;

  const app = (
    <SafeAreaProvider>
      <AuthProvider>
        <ToastProvider>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
        </ToastProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* react-native-keyboard-controller's KeyboardAvoidingView/useKeyboard* hooks (used
       *  throughout via components/ui/KeyboardSafe.tsx) do nothing without this provider
       *  mounted above them — it ships no web implementation, so skip it there (KeyboardSafe
       *  already falls back to RN core's KeyboardAvoidingView on web). */}
      {Platform.OS === 'web' ? app : <KeyboardProvider>{app}</KeyboardProvider>}
    </GestureHandlerRootView>
  );
}
