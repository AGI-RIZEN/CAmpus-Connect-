import React from 'react';
import { RefreshControl, View, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from './KeyboardSafe';
import { colors } from '@/lib/theme';

type Props = ViewProps & {
  scroll?: boolean;
  padded?: boolean;
  dark?: boolean;
  className?: string;
  contentClassName?: string;
  /** Pass both to get a pull-to-refresh spinner for free (e.g. from useFakeRefresh()). */
  refreshing?: boolean;
  onRefresh?: () => void;
};

export function Screen({
  scroll = true,
  padded = true,
  dark,
  className = '',
  contentClassName = '',
  children,
  refreshing,
  onRefresh,
  ...props
}: Props) {
  const bg = dark ? 'bg-ink' : 'bg-background dark:bg-background-dark';
  if (!scroll) {
    return (
      <SafeAreaView className={`flex-1 ${bg} ${className}`} {...props}>
        <View className={`flex-1 ${padded ? 'px-screen' : ''} ${contentClassName}`}>{children}</View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView className={`flex-1 ${bg} ${className}`} {...props}>
      {/* `KeyboardAwareScrollView` is a third-party component, not one of the handful NativeWind
          patches to understand `className` (View/Text/Image/Pressable/ScrollView/...) — so its
          own props stay on plain `style`, and the Tailwind-styled padding/spacing lives on the
          plain `View` wrapping `children` instead, where `className` is guaranteed to work. */}
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bottomOffset={20}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          ) : undefined
        }
      >
        <View className={`${padded ? 'px-screen' : ''} pb-10 ${contentClassName}`}>{children}</View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
