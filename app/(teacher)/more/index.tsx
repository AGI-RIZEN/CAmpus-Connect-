import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight, LogOut, Settings } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { H1, BodyMedium, Caption } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { Reveal } from '@/components/ui/Reveal';
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

export default function TeacherMoreScreen() {
  const { user, setUser } = useAuth();
  const toast = useToast();

  return (
    <Screen>
      <H1 className="mt-6 mb-5">More</H1>

      <Reveal index={0}>
        <View style={softShadow} className="flex-row items-center bg-white dark:bg-surface-dark rounded-card py-4 px-4 mb-5">
          <Avatar uri={user?.avatarUrl} name={user?.fullName} size={56} />
          <View className="ml-3.5 flex-1">
            <BodyMedium numberOfLines={1}>{user?.fullName ?? 'Teacher'}</BodyMedium>
            <Caption className="mt-0.5">{user?.email ?? ''}</Caption>
          </View>
        </View>
      </Reveal>

      <View className="mt-2">
        <Reveal index={1}>
          <Row
            icon={<Settings size={20} color={colors.primary} />}
            label="Account Settings"
            sublabel="Profile, dark mode, notifications"
            onPress={() => router.push('/(app)/profile/settings')}
          />
        </Reveal>

        <View className="mt-4">
          <Reveal index={2}>
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
          </Reveal>
        </View>
      </View>
    </Screen>
  );
}
