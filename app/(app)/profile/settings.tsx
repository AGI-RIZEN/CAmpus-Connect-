import React, { useEffect, useState } from 'react';
import { Switch, View } from 'react-native';
import { router } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Moon, Bell, Lock, FileText, LogOut, ChevronRight } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { BodyMedium, Caption } from '@/components/ui/Text';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { colors, softShadow } from '@/lib/theme';
import { useToast } from '@/components/ui/Toast';
import { haptic } from '@/lib/haptics';
import { logout as apiLogout } from '@/lib/api/auth';
import { useAuth } from '@/lib/auth-context';
import {
  getNotificationsPreference,
  setNotificationsPreference,
  registerForPushNotifications,
  unregisterPushNotifications,
} from '@/lib/push-notifications';

function Row({
  icon,
  label,
  sublabel,
  right,
  onPress,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
}) {
  return (
    <AnimatedPressable
      disabled={!onPress}
      onPress={onPress}
      scaleTo={0.98}
      haptics="tap"
      style={softShadow}
      className="flex-row items-center justify-between bg-white dark:bg-surface-dark rounded-card py-4 px-4 mb-3"
    >
      <View className="flex-row items-center flex-1 pr-3">
        <View
          className={`w-10 h-10 rounded-full items-center justify-center mr-3.5 ${
            danger ? 'bg-danger/15' : 'bg-card-lavender dark:bg-card-lavender-dark'
          }`}
        >
          {icon}
        </View>
        <View className="flex-1">
          <BodyMedium className={danger ? 'text-danger' : ''}>{label}</BodyMedium>
          {sublabel ? <Caption className="mt-0.5">{sublabel}</Caption> : null}
        </View>
      </View>
      {right}
    </AnimatedPressable>
  );
}

export default function SettingsScreen() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const [notifications, setNotifications] = useState(true);
  const toast = useToast();
  const { setUser } = useAuth();

  const isDark = colorScheme === 'dark';

  useEffect(() => {
    getNotificationsPreference().then(setNotifications);
  }, []);

  const toggleNotifications = async (value: boolean) => {
    haptic.select();
    setNotifications(value);
    await setNotificationsPreference(value);
    if (value) {
      await registerForPushNotifications();
    } else {
      await unregisterPushNotifications();
    }
  };

  return (
    <Screen>
      <Header title="Settings" />

      <View className="mt-2">
        <Row
          icon={<Moon size={20} color={colors.primary} />}
          label="Dark Mode"
          sublabel={isDark ? 'On' : 'Off'}
          right={
            <Switch
              value={isDark}
              onValueChange={(value) => {
                haptic.select();
                setColorScheme(value ? 'dark' : 'light');
              }}
              trackColor={{ false: colors.borderLight, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          }
        />

        <Row
          icon={<Bell size={20} color={colors.primary} />}
          label="Notifications"
          sublabel={notifications ? 'Enabled' : 'Disabled'}
          right={
            <Switch
              value={notifications}
              onValueChange={toggleNotifications}
              trackColor={{ false: colors.borderLight, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          }
        />

        <Row
          icon={<Lock size={20} color={colors.primary} />}
          label="Change Password"
          right={<ChevronRight size={20} color={colors.textSecondary} />}
          onPress={() => toast('Password change flow coming soon', 'info')}
        />

        <Row
          icon={<FileText size={20} color={colors.primary} />}
          label="Terms & Conditions"
          right={<ChevronRight size={20} color={colors.textSecondary} />}
          onPress={() => router.push('/(auth)/terms')}
        />

        <View className="mt-4">
          <Row
            icon={<LogOut size={20} color={colors.danger} />}
            label="Logout"
            danger
            onPress={async () => {
              haptic.warning();
              await apiLogout();
              setUser(null);
              toast('Logged out', 'info');
              router.replace('/(auth)/login');
            }}
          />
        </View>
      </View>
    </Screen>
  );
}
