import React from 'react';
import { View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { BodyMedium } from './Text';
import { AnimatedPressable } from './AnimatedPressable';
import { colors, softShadow } from '@/lib/theme';

type Props = Omit<PressableProps, 'style'> & {
  label: string;
  className?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Dark pill, white label, circular arrow bubble on the right. The signature CTA. */
export function PrimaryButton({ label, className = '', disabled, style, ...props }: Props) {
  return (
    <AnimatedPressable
      disabled={disabled}
      style={[softShadow, style]}
      className={`flex-row items-center justify-between bg-ink rounded-full pl-6 pr-2 py-2 ${
        disabled ? 'opacity-40' : ''
      } ${className}`}
      {...props}
    >
      <BodyMedium className="text-white">{label}</BodyMedium>
      <View className="w-9 h-9 rounded-full bg-white items-center justify-center ml-3">
        <ArrowRight size={18} color={colors.ink} />
      </View>
    </AnimatedPressable>
  );
}

/** White pill, ink label, subtle border — secondary action. */
export function SecondaryButton({ label, className = '', disabled, style, ...props }: Props) {
  return (
    <AnimatedPressable
      disabled={disabled}
      style={[softShadow, style]}
      className={`flex-row items-center justify-center bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-full px-6 py-3.5 ${
        disabled ? 'opacity-40' : ''
      } ${className}`}
      {...props}
    >
      <BodyMedium>{label}</BodyMedium>
    </AnimatedPressable>
  );
}

type GhostProps = Props & { tone?: 'danger' | 'default' };

export function TextLinkButton({ label, className = '', tone = 'default', ...props }: GhostProps) {
  return (
    <AnimatedPressable className={className} haptics="select" scaleTo={0.97} {...props}>
      <BodyMedium className={tone === 'danger' ? 'text-danger' : 'text-primary'}>{label}</BodyMedium>
    </AnimatedPressable>
  );
}
