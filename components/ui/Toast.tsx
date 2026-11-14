import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming, useSharedValue } from 'react-native-reanimated';
import { CheckCircle2, Info, XCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Body } from './Text';
import { colors, softShadowLg } from '@/lib/theme';

type ToastType = 'success' | 'error' | 'info';
type ToastState = { message: string; type: ToastType } | null;

const ToastContext = createContext<(message: string, type?: ToastType) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

const icons = { success: CheckCircle2, error: XCircle, info: Info };
const iconColor: Record<ToastType, string> = {
  success: colors.success,
  error: colors.danger,
  info: colors.primary,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState>(null);
  const opacity = useSharedValue(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const insets = useSafeAreaInsets();

  const show = useCallback((message: string, type: ToastType = 'success') => {
    setToast({ message, type });
    opacity.value = withTiming(1, { duration: 200 });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 200 });
    }, 2200);
  }, []);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const Icon = toast ? icons[toast.type] : null;

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast && (
        <Animated.View
          style={[style, softShadowLg, { position: 'absolute', top: insets.top + 12, left: 20, right: 20 }]}
        >
          <View className="flex-row items-center bg-white dark:bg-surface-dark rounded-card px-4 py-3.5">
            {Icon && <Icon size={20} color={iconColor[toast.type]} />}
            <Body className="ml-2.5 flex-1">{toast.message}</Body>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}
