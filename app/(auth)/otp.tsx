import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { H1, Body, BodyMedium } from '@/components/ui/Text';
import { PrimaryButton } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Reveal } from '@/components/ui/Reveal';
import { Illustration } from '@/components/screens/auth/Illustration';
import { OtpBoxes } from '@/components/screens/auth/OtpBoxes';
import { haptic } from '@/lib/haptics';
import { verifyOtp, resendOtp } from '@/lib/api/auth';
import { ApiRequestError } from '@/lib/api/client';
import { routeForUser } from '@/lib/auth-routing';
import { useAuth } from '@/lib/auth-context';

const RESEND_SECONDS = 60;

export default function Otp() {
  const toast = useToast();
  const { userId } = useLocalSearchParams<{ userId: string; email?: string }>();
  const { setUser } = useAuth();
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const [complete, setComplete] = useState(false);
  const [code, setCode] = useState('');
  const [resetKey, setResetKey] = useState(0);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [seconds]);

  // Subtle cue when the resend button becomes tappable again.
  useEffect(() => {
    if (seconds === 0) haptic.tap();
  }, [seconds]);

  const handleVerify = async (submittedCode?: string) => {
    const finalCode = submittedCode ?? code;
    if (verifying || finalCode.length !== 6 || !userId) return;
    setVerifying(true);
    try {
      const result = await verifyOtp(userId, finalCode);
      setUser(result.user);
      router.replace(routeForUser(result.user));
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : 'Something went wrong. Try again.';
      toast(message, 'error');
      haptic.error();
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (seconds > 0 || !userId) return;
    try {
      await resendOtp(userId);
      setSeconds(RESEND_SECONDS);
      setComplete(false);
      setCode('');
      setResetKey((k) => k + 1);
      toast('OTP resent', 'success');
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : 'Could not resend code';
      toast(message, 'error');
    }
  };

  return (
    <Screen>
      <Header title="Verify Email" />

      <View className="items-center mt-4 mb-8">
        <Reveal index={0} spring scaleIn>
          <Illustration emoji="✉️" tone="sky" size={160} />
        </Reveal>
        <Reveal index={1} className="items-center">
          <H1 className="mt-6 text-center">Check your inbox</H1>
          <Body className="mt-2 text-center text-text-secondary dark:text-text-secondary-dark">
            We&apos;ve sent a 6-digit verification code to your email address.
          </Body>
        </Reveal>
      </View>

      <Reveal index={2} spring scaleIn>
        <OtpBoxes
          key={resetKey}
          onComplete={(c) => {
            setCode(c);
            handleVerify(c);
          }}
          onChange={(v) => {
            setComplete(v.every((d) => d !== ''));
            setCode(v.join(''));
          }}
        />
      </Reveal>

      <Reveal index={3}>
        <PrimaryButton
          label={verifying ? 'Verifying…' : 'Verify'}
          disabled={!complete || verifying}
          onPress={() => handleVerify()}
          className="mt-8"
        />
      </Reveal>

      <Reveal index={4} className="flex-row justify-center mt-6">
        <Body>Didn&apos;t receive the code? </Body>
        <Pressable disabled={seconds > 0} onPress={handleResend}>
          <BodyMedium className={seconds > 0 ? 'text-text-secondary dark:text-text-secondary-dark' : 'text-primary'}>
            {seconds > 0
              ? `Resend in ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
              : 'Resend OTP'}
          </BodyMedium>
        </Pressable>
      </Reveal>
    </Screen>
  );
}
