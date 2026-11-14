import React from 'react';
import {
  Platform,
  ScrollView,
  KeyboardAvoidingView as RNKeyboardAvoidingView,
  type ScrollViewProps,
  type KeyboardAvoidingViewProps,
} from 'react-native';
import {
  KeyboardAwareScrollView as RNCKeyboardAwareScrollView,
  KeyboardAvoidingView as RNCKeyboardAvoidingView,
} from 'react-native-keyboard-controller';

/**
 * react-native-keyboard-controller ships no web implementation — it relies on a native
 * KeyboardProvider that doesn't exist on web, so its web JS fallback throws an uncaught
 * "PromiseResolve called on non-object" on every mount. Swap in RN core's own (behavior-less
 * but crash-free) equivalents on web, and keep the real keyboard-aware behavior on native.
 */

type AwareScrollProps = ScrollViewProps & { bottomOffset?: number };

export function KeyboardAwareScrollView({ bottomOffset, ...props }: AwareScrollProps) {
  if (Platform.OS === 'web') return <ScrollView {...props} />;
  return <RNCKeyboardAwareScrollView bottomOffset={bottomOffset} {...props} />;
}

export function KeyboardAvoidingView(props: KeyboardAvoidingViewProps) {
  if (Platform.OS === 'web') return <RNKeyboardAvoidingView {...props} />;
  return <RNCKeyboardAvoidingView {...props} />;
}
