import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { H1, Body } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { SecondaryButton } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Illustration } from '@/components/screens/auth/Illustration';
import { StepTracker, type Step } from '@/components/screens/auth/StepTracker';
import { useAuth } from '@/lib/auth-context';
import { routeForUser } from '@/lib/auth-routing';

const steps: Step[] = [
  { label: 'Registered', sublabel: 'Your account details were submitted', status: 'done' },
  { label: 'Email verified', sublabel: 'We confirmed your college email', status: 'done' },
  { label: 'Admin approval', sublabel: 'Waiting for the admin to review your account', status: 'pending' },
];

export default function WaitingApproval() {
  const toast = useToast();
  const { refreshUser } = useAuth();
  const [checking, setChecking] = useState(false);

  const handleRefresh = async () => {
    if (checking) return;
    setChecking(true);
    try {
      const user = await refreshUser();
      if (!user) {
        toast('Could not check status — try logging in again', 'error');
        return;
      }
      if (user.status === 'Active') {
        toast('Approved! Welcome in', 'success');
        router.replace(routeForUser(user));
      } else if (user.status === 'Banned' || user.status === 'Rejected') {
        router.replace(routeForUser(user));
      } else {
        toast('Still pending approval', 'info');
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <Screen contentClassName="pt-6">
      <Card tone="lavender" className="items-center">
        <Illustration emoji="⏳" tone="lavender" size={180} />
        <H1 className="mt-6 text-center">You&apos;re almost in!</H1>
        <Body className="mt-2 mb-8 text-center text-text-secondary dark:text-text-secondary-dark">
          Your account is being reviewed by the admin. We&apos;ll notify you once approved.
        </Body>

        <View className="self-stretch mb-8">
          <StepTracker steps={steps} />
        </View>

        <SecondaryButton
          label={checking ? 'Checking…' : 'Refresh status'}
          className="self-stretch"
          disabled={checking}
          onPress={handleRefresh}
        />
      </Card>
    </Screen>
  );
}
