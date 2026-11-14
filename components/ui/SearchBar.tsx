import React from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import { Search } from 'lucide-react-native';
import { colors } from '@/lib/theme';

type Props = TextInputProps & { className?: string };

export function SearchBar({ className = '', ...props }: Props) {
  return (
    <View
      className={`flex-row items-center bg-white dark:bg-surface-dark rounded-full px-4 py-3 border border-border-light dark:border-border-dark ${className}`}
    >
      <Search size={20} color={colors.textSecondary} />
      <TextInput
        placeholderTextColor={colors.textSecondary}
        className="flex-1 ml-2 font-poppins text-body text-text-primary dark:text-text-primary-dark"
        {...props}
      />
    </View>
  );
}
