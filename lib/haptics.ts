import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const supported = Platform.OS === 'ios' || Platform.OS === 'android';

export const haptic = {
  tap: () => supported && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}),
  select: () => supported && Haptics.selectionAsync().catch(() => {}),
  success: () => supported && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}),
  warning: () => supported && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {}),
  error: () => supported && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {}),
  heavy: () => supported && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}),
};
