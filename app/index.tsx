import React, { useEffect, useState } from 'react';
import { View, Text as RNText } from 'react-native';
import { router } from 'expo-router';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Screen } from '@/components/ui/Screen';
import { Display } from '@/components/ui/Text';
import { useAuth } from '@/lib/auth-context';
import { routeForUser } from '@/lib/auth-routing';

export default function Splash() {
  const progress = useSharedValue(0);
  const { user, bootstrapping } = useAuth();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
    const t = setTimeout(() => setMinTimeElapsed(true), 1800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!minTimeElapsed || bootstrapping) return;
    // A valid stored session (checked against the real backend by AuthProvider) skips
    // onboarding/login entirely and goes straight to where that user belongs.
    router.replace(user ? routeForUser(user) : '/(onboarding)/onboarding');
  }, [minTimeElapsed, bootstrapping, user]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: progress.value * 0.2,
    transform: [{ scale: 0.8 + progress.value * 0.2 }],
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.8 + progress.value * 0.2 }],
  }));

  return (
    <Screen scroll={false} dark contentClassName="items-center justify-center">
      {/* Subtle violet glow behind the logo */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 320,
            height: 320,
            marginLeft: -160,
            marginTop: -160,
            borderRadius: 160,
          },
          glowStyle,
        ]}
        className="bg-primary"
      />

      <Animated.View style={logoStyle} className="items-center">
        <View
          style={{ width: 96, height: 96, borderRadius: 48 }}
          className="bg-primary items-center justify-center mb-6"
        >
          <RNText style={{ fontSize: 42 }}>🎓</RNText>
        </View>
        <Display className="text-white text-center">Campus Connect</Display>
      </Animated.View>
    </Screen>
  );
}
