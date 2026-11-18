import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Mail } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { H1, Body } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { PrimaryButton } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Reveal } from '@/components/ui/Reveal';
import { Illustration } from '@/components/screens/auth/Illustration';
import { colors } from '@/lib/theme';
import { forgotPassword } from '@/lib/api/auth';
import { ApiRequestError } from '@/lib/api/client';

export default function ForgotPassword() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (sending) return;
    setSending(true);
    try {
      await forgotPassword(email.trim());
      toast('If that email exists, a reset link was sent', 'success');
      router.push({ pathname: '/(auth)/reset-password', params: { email: email.trim() } });
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : 'Something went wrong. Try again.';
      toast(message, 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen>
      <Header title="Forgot Password" />

      <View className="items-center mt-4 mb-8">
        <Reveal index={0} spring scaleIn>
          <Illustration emoji="🔑" tone="lavender" size={140} />
        </Reveal>
        <Reveal index={1} className="items-center">
          <H1 className="mt-6 text-center">Forgot your password?</H1>
          <Body className="mt-2 text-center text-text-secondary dark:text-text-secondary-dark">
            No worries, enter your college email and we&apos;ll send you a reset link.
          </Body>
        </Reveal>
      </View>

      <Reveal index={2}>
        <Input
          label="Email"
          placeholder="you@college.edu"
          autoCapitalize="none"
          keyboardType="email-address"
          leftIcon={<Mail size={20} color={colors.textSecondary} />}
          value={email}
          onChangeText={setEmail}
          className="mb-8"
        />
      </Reveal>

      <Reveal index={3}>
        <PrimaryButton
          label={sending ? 'Sending…' : 'Send Reset Link'}
          disabled={!email || sending}
          onPress={handleSend}
        />
      </Reveal>
    </Screen>
  );
}
