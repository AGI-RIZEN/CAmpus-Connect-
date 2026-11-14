import React from 'react';
import { Linking } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { H2, Body } from '@/components/ui/Text';
import { PrimaryButton } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Illustration } from '@/components/screens/auth/Illustration';

const SUPPORT_EMAIL = 'admin@campusconnect.edu';

const DEFAULT_REASON =
  'Violation of community guidelines — posting spam content repeatedly. If you believe this is a mistake, please contact the admin team.';

export default function Banned() {
  const toast = useToast();
  const { reason } = useLocalSearchParams<{ reason?: string }>();

  return (
    <Screen
      scroll={false}
      className="bg-danger/10 dark:bg-danger/10"
      contentClassName="items-center justify-center"
    >
      <Illustration emoji="🔒" size={180} bgClassName="bg-danger/15" />

      <H2 className="mt-8 text-center">Your account has been suspended</H2>
      <Body className="mt-3 mb-10 text-center text-text-secondary dark:text-text-secondary-dark">
        Reason: {reason || DEFAULT_REASON}
      </Body>

      <PrimaryButton
        label="Contact Admin"
        className="self-stretch"
        onPress={() => {
          const subject = encodeURIComponent('Account suspension appeal');
          const body = encodeURIComponent(`Reason given: ${reason || DEFAULT_REASON}\n\nPlease describe why you believe this was a mistake:\n`);
          Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`).catch(() =>
            toast('No email app available on this device', 'error')
          );
        }}
      />
    </Screen>
  );
}
