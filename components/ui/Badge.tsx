import React from 'react';
import { View } from 'react-native';
import { Caption } from './Text';

type Tone = 'success' | 'warning' | 'danger' | 'primary' | 'neutral';

const toneClasses: Record<Tone, { bg: string; text: string }> = {
  success: { bg: 'bg-success/15', text: 'text-success' },
  warning: { bg: 'bg-warning/15', text: 'text-warning' },
  danger: { bg: 'bg-danger/15', text: 'text-danger' },
  primary: { bg: 'bg-primary/15', text: 'text-primary' },
  neutral: { bg: 'bg-text-secondary/15', text: 'text-text-secondary' },
};

export function Badge({ label, tone = 'neutral', className = '' }: { label: string; tone?: Tone; className?: string }) {
  const t = toneClasses[tone];
  return (
    <View className={`self-start rounded-full px-3 py-1 ${t.bg} ${className}`}>
      <Caption className={`${t.text} font-poppins-semibold`}>{label}</Caption>
    </View>
  );
}

export function statusTone(
  status: 'Pending' | 'Approved' | 'Rejected' | 'Active' | 'Banned' | 'PendingApproval'
): Tone {
  switch (status) {
    case 'Approved':
    case 'Active':
      return 'success';
    case 'Pending':
    case 'PendingApproval':
      return 'warning';
    case 'Rejected':
    case 'Banned':
      return 'danger';
    default:
      return 'neutral';
  }
}
