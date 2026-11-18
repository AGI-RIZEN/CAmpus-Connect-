import React, { useState } from 'react';
import { Dimensions, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from '@/components/ui/KeyboardSafe';
import { router } from 'expo-router';
import { Mail, Lock } from 'lucide-react-native';
import { Display, Body, BodyMedium } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { PrimaryButton, TextLinkButton } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Reveal } from '@/components/ui/Reveal';
import { GradientBlob } from '@/components/ui/GradientBlob';
import { Drift } from '@/components/ui/Drift';
import { useToast } from '@/components/ui/Toast';
import { avatar } from '@/lib/mock-data';
import { colors } from '@/lib/theme';
import { login } from '@/lib/api/auth';
import { ApiRequestError } from '@/lib/api/client';
import { routeForUser } from '@/lib/auth-routing';
import { useAuth } from '@/lib/auth-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const TOP_HEIGHT = SCREEN_HEIGHT * 0.4;

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const { setUser } = useAuth();

  const handleLogin = async () => {
    if (loggingIn) return;
    setError(null);
    setLoggingIn(true);
    try {
      const result = await login(email.trim(), password);
      setUser(result.user);
      router.replace(routeForUser(result.user));
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : 'Something went wrong. Try again.';
      const bannedMatch = /^Account banned:\s*(.+)/.exec(message);
      if (bannedMatch) {
        router.replace({ pathname: '/(auth)/banned', params: { reason: bannedMatch[1] } });
        return;
      }
      setError(message);
      toast(message, 'error');
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-ink">
      {/* `overflow: hidden` keeps the ambient blobs clipped to the dark hero band. */}
      <View className="px-screen" style={{ height: TOP_HEIGHT, position: 'relative', overflow: 'hidden' }}>
        <GradientBlob />

        {/* Floating 3D student avatars — each springs in with a slight stagger, then drifts
            gently forever after. Reveal owns the absolute positioning + one-time entrance;
            Drift (nested inside) adds the ongoing ambient motion so the hero doesn't go static
            once the entrance finishes — each gets a different duration so they don't move in
            lockstep. */}
        <Reveal index={0} spring scaleIn style={{ position: 'absolute', top: 8, left: 20 }}>
          <Drift range={10} duration={4200}>
            <View style={{ width: 64, height: 64, borderRadius: 32 }} className="bg-card-lavender items-center justify-center">
              <Avatar uri={avatar('login-a')} size={48} ring />
            </View>
          </Drift>
        </Reveal>
        <Reveal index={1} spring scaleIn style={{ position: 'absolute', top: 54, right: 28 }}>
          <Drift range={12} duration={5000}>
            <View style={{ width: 72, height: 72, borderRadius: 36 }} className="bg-card-peach items-center justify-center">
              <Avatar uri={avatar('login-b')} size={54} ring />
            </View>
          </Drift>
        </Reveal>
        <Reveal index={2} spring scaleIn style={{ position: 'absolute', top: 128, left: 64 }}>
          <Drift range={9} duration={5800}>
            <View style={{ width: 52, height: 52, borderRadius: 26 }} className="bg-card-sky items-center justify-center">
              <Avatar uri={avatar('login-c')} size={40} ring />
            </View>
          </Drift>
        </Reveal>

        {/* Small colored dot accents */}
        <Reveal index={3} spring scaleIn style={{ position: 'absolute', top: 20, right: 90 }}>
          <Drift range={8} duration={4600}>
            <View style={{ width: 10, height: 10, borderRadius: 5 }} className="bg-card-mint" />
          </Drift>
        </Reveal>
        <Reveal index={4} spring scaleIn style={{ position: 'absolute', top: 100, left: 16 }}>
          <Drift range={7} duration={5400}>
            <View style={{ width: 8, height: 8, borderRadius: 4 }} className="bg-card-butter" />
          </Drift>
        </Reveal>
        <Reveal index={5} spring scaleIn style={{ position: 'absolute', top: 160, right: 44 }}>
          <Drift range={11} duration={6200}>
            <View style={{ width: 12, height: 12, borderRadius: 6 }} className="bg-primary opacity-60" />
          </Drift>
        </Reveal>

        <Reveal index={2} className="flex-1 justify-end pb-10">
          <Display className="text-white">Welcome back{'\n'}to campus!</Display>
        </Reveal>
      </View>

      {/* `KeyboardAwareScrollView` is a third-party component, not one NativeWind patches to
          understand `className` — the rounded white sheet's background/shape styling lives on
          this plain wrapping `View` instead, where `className` is guaranteed to work. */}
      <View className="flex-1 bg-white dark:bg-surface-dark rounded-t-[32px] -mt-8">
        <KeyboardAwareScrollView style={{ flex: 1 }} bottomOffset={20} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Reveal index={4} className="px-screen pt-8 pb-10">
            <Input
              label="Email"
              placeholder="you@college.edu"
              autoCapitalize="none"
              keyboardType="email-address"
              leftIcon={<Mail size={20} color={colors.textSecondary} />}
              value={email}
              onChangeText={setEmail}
              className="mb-4"
            />
            <Input
              label="Password"
              placeholder="••••••••"
              secure
              leftIcon={<Lock size={20} color={colors.textSecondary} />}
              value={password}
              onChangeText={setPassword}
              error={error ?? undefined}
            />

            <TextLinkButton
              label="Forgot password?"
              className="self-end mt-3 mb-6"
              onPress={() => router.push('/(auth)/forgot-password')}
            />

            <PrimaryButton
              label={loggingIn ? 'Logging in…' : 'Log In'}
              disabled={loggingIn}
              onPress={handleLogin}
              shine
            />

            <View className="flex-row justify-center mt-6">
              <Body>New here? </Body>
              <Pressable onPress={() => router.push('/(auth)/signup')}>
                <BodyMedium className="text-primary">Sign Up</BodyMedium>
              </Pressable>
            </View>
          </Reveal>
        </KeyboardAwareScrollView>
      </View>
    </SafeAreaView>
  );
}
