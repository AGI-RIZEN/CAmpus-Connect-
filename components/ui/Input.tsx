import React, { useState } from 'react';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { Caption } from './Text';
import { colors } from '@/lib/theme';

type Props = TextInputProps & {
  label?: string;
  className?: string;
  secure?: boolean;
  leftIcon?: React.ReactNode;
  error?: string;
};

export function Input({ label, className = '', secure, leftIcon, error, ...props }: Props) {
  const [hidden, setHidden] = useState(true);
  const isSecure = secure && hidden;

  return (
    <View className={className}>
      {label && <Caption className="mb-2">{label}</Caption>}
      <View
        className={`flex-row items-center rounded-input bg-white dark:bg-surface-dark border px-4 ${
          error ? 'border-danger' : 'border-border-light dark:border-border-dark'
        }`}
      >
        {leftIcon && <View className="mr-2">{leftIcon}</View>}
        <TextInput
          placeholderTextColor={colors.textSecondary}
          secureTextEntry={isSecure}
          className="flex-1 py-3.5 font-poppins text-body text-text-primary dark:text-text-primary-dark"
          {...props}
        />
        {secure && (
          <Pressable onPress={() => setHidden((h) => !h)} className="pl-2 py-1">
            {hidden ? (
              <EyeOff size={20} color={colors.textSecondary} />
            ) : (
              <Eye size={20} color={colors.textSecondary} />
            )}
          </Pressable>
        )}
      </View>
      {error && <Caption className="text-danger mt-1">{error}</Caption>}
    </View>
  );
}
