import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Settings, Users, KeyRound, LogOut, ChevronRight } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { BodyMedium, Caption } from '@/components/ui/Text';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { haptic } from '@/lib/haptics';
import { colors, softShadow } from '@/lib/theme';
import { logout as apiLogout } from '@/lib/api/auth';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/Toast';

function Row({
  icon,
  label,
  sublabel,
  onPress,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <AnimatedPressable
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
      {!danger && <ChevronRight size={20} color={colors.textSecondary} />}
    </AnimatedPressable>
  );
}

export default function AdminMoreScreen() {
  const { setUser } = useAuth();
  const toast = useToast();

  return (
    <Screen>
      <Header title="More" />

      <View className="mt-2">
        <Row
          icon={<Settings size={20} color={colors.primary} />}
          label="Account Settings"
          sublabel="Profile, dark mode, notifications"
          onPress={() => router.push('/(app)/profile/settings')}
        />

        <Row
          icon={<Users size={20} color={colors.primary} />}
          label="User Management"
          sublabel="Manage student & teacher accounts"
          onPress={() => router.push('/(admin)/more/users')}
        />

        <Row
          icon={<KeyRound size={20} color={colors.primary} />}
          label="Signup Codes"
          sublabel="Generate and share codes for new signups"
          onPress={() => router.push('/(admin)/more/signup-codes')}
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
