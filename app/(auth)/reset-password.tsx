import React, { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Lock, KeyRound } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { H1, Body, Caption } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { PrimaryButton } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Illustration } from '@/components/screens/auth/Illustration';
import { colors } from '@/lib/theme';
import { resetPassword } from '@/lib/api/auth';
import { ApiRequestError } from '@/lib/api/client';

export default function ResetPassword() {
  const toast = useToast();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const mismatch = confirm.length > 0 && password !== confirm;
  const canSubmit = token.length > 0 && password.length >= 6 && !mismatch && !submitting;

  // Tolerate someone pasting the full campusconnect://reset-password?token=... link instead of
  // just the bare code — extract the token either way.
  function extractToken(raw: string): string {
    const trimmed = raw.trim();
    const match = /[?&]token=([^&\s]+)/.exec(trimmed);
    return match ? decodeURIComponent(match[1]) : trimmed;
  }

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await resetPassword(extractToken(token), password);
      toast('Password updated', 'success');
      router.replace('/(auth)/login');
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : 'Something went wrong. Try again.';
      toast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <Header title="Reset Password" />

      <View className="items-center mt-4 mb-8">
        <Illustration emoji="🔒" tone="mint" size={140} />
        <H1 className="mt-6 text-center">Set a new password</H1>
        <Body className="mt-2 text-center text-text-secondary dark:text-text-secondary-dark">
          Choose a strong password you haven&apos;t used before.
        </Body>
      </View>

      <Input
        label="Reset code"
        placeholder="Paste the code from your email"
        autoCapitalize="none"
        leftIcon={<KeyRound size={20} color={colors.textSecondary} />}
        value={token}
        onChangeText={setToken}
        className="mb-2"
      />
      <Caption className="mb-4 text-text-secondary dark:text-text-secondary-dark">
        {email ? `Sent to ${email} — check your inbox (or the dev server log) for the code.` : 'Check your inbox for the reset code.'}
      </Caption>

      <Input
        label="New password"
        placeholder="••••••••"
        secure
        leftIcon={<Lock size={20} color={colors.textSecondary} />}
        value={password}
        onChangeText={setPassword}
        className="mb-4"
      />
      <Input
        label="Confirm password"
        placeholder="••••••••"
        secure
        leftIcon={<Lock size={20} color={colors.textSecondary} />}
        value={confirm}
        onChangeText={setConfirm}
        error={mismatch ? 'Passwords do not match' : ''}
        className="mb-8"
      />

      <PrimaryButton
        label={submitting ? 'Resetting…' : 'Reset Password'}
        disabled={!canSubmit}
        onPress={handleSubmit}
      />
    </Screen>
  );
}
