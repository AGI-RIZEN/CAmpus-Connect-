import React from 'react';
import { Text, type TextProps } from 'react-native';

type Props = TextProps & { className?: string };

const base = 'text-text-primary dark:text-text-primary-dark';

export function Display({ className = '', ...props }: Props) {
  return <Text className={`font-poppins-bold text-display ${base} ${className}`} {...props} />;
}

export function H1({ className = '', ...props }: Props) {
  return <Text className={`font-poppins-semibold text-h1 ${base} ${className}`} {...props} />;
}

export function H2({ className = '', ...props }: Props) {
  return <Text className={`font-poppins-semibold text-h2 ${base} ${className}`} {...props} />;
}

export function Body({ className = '', ...props }: Props) {
  return <Text className={`font-poppins text-body ${base} ${className}`} {...props} />;
}

export function BodyMedium({ className = '', ...props }: Props) {
  return <Text className={`font-poppins-medium text-body ${base} ${className}`} {...props} />;
}

export function Caption({ className = '', ...props }: Props) {
  return (
    <Text
      className={`font-poppins-medium text-caption text-text-secondary dark:text-text-secondary-dark ${className}`}
      {...props}
    />
  );
}
