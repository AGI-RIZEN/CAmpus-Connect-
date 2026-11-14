import React from 'react';
import { View } from 'react-native';
import { H2, Body } from './Text';

type Props = {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function EmptyState({ icon, title, description, action }: Props) {
  return (
    <View className="items-center justify-center py-16 px-8">
      <View className="w-24 h-24 rounded-full bg-card-lavender dark:bg-card-lavender-dark items-center justify-center mb-5">
        {icon}
      </View>
      <H2 className="text-center">{title}</H2>
      {description && <Body className="text-text-secondary dark:text-text-secondary-dark text-center mt-2">{description}</Body>}
      {action && <View className="mt-6">{action}</View>}
    </View>
  );
}
