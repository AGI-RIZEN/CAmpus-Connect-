import React from 'react';
import { View } from 'react-native';
import { WifiOff } from 'lucide-react-native';
import { H2, Body } from './Text';
import { PrimaryButton } from './Button';
import { colors } from '@/lib/theme';

type Props = {
  onRetry: () => void;
  title?: string;
  description?: string;
};

/** Shown in place of a screen's normal content/empty state when its load failed specifically
 *  because the device couldn't reach the server at all (see `isNetworkError` in
 *  lib/api/client.ts) — distinct from a real server error or a genuinely empty list. */
export function OfflineState({ onRetry, title = "You're offline", description = 'Check your internet connection and try again.' }: Props) {
  return (
    <View className="items-center justify-center py-16 px-8">
      <View className="w-24 h-24 rounded-full bg-card-lavender dark:bg-card-lavender-dark items-center justify-center mb-5">
        <WifiOff size={32} color={colors.primary} />
      </View>
      <H2 className="text-center">{title}</H2>
      <Body className="text-text-secondary dark:text-text-secondary-dark text-center mt-2">{description}</Body>
      <View className="mt-6 self-stretch">
        <PrimaryButton label="Retry" onPress={onRetry} />
      </View>
    </View>
  );
}
