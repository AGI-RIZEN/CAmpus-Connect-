import React from 'react';
import { View, type ViewProps } from 'react-native';
import { softShadow } from '@/lib/theme';
import { cardToneClasses, type CardTone } from '@/lib/theme';

type Props = ViewProps & {
  tone?: CardTone | 'white' | 'ink';
  className?: string;
  noShadow?: boolean;
};

const toneClass = (tone: Props['tone']) => {
  if (!tone || tone === 'white') return 'bg-white dark:bg-surface-dark';
  if (tone === 'ink') return 'bg-ink';
  return cardToneClasses[tone];
};

export function Card({ tone, className = '', noShadow, style, children, ...props }: Props) {
  return (
    <View
      style={[noShadow ? undefined : softShadow, style]}
      className={`rounded-card p-5 ${toneClass(tone)} ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}
