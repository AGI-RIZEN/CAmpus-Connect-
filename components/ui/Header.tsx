import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { IconButton } from './IconButton';
import { H2 } from './Text';
import { colors } from '@/lib/theme';

type Props = {
  title?: string;
  right?: React.ReactNode;
  onBack?: () => void;
  className?: string;
};

// Falls back to the root splash (which redirects based on auth state) when there's no back
// history to pop — e.g. the app was backgrounded on Android and relaunched straight into this
// screen, leaving `router.back()` with nothing to do and the button looking broken.
function defaultOnBack() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/');
  }
}

export function Header({ title, right, onBack, className = '' }: Props) {
  return (
    <View className={`flex-row items-center justify-between py-4 ${className}`}>
      <IconButton onPress={onBack ?? defaultOnBack}>
        <ChevronLeft size={22} color={colors.ink} />
      </IconButton>
      {title ? <H2 className="flex-1 text-center -ml-11">{title}</H2> : <View className="flex-1" />}
      {right ?? <View style={{ width: 44 }} />}
    </View>
  );
}
