import React from 'react';
import { View } from 'react-native';
import { Avatar } from './Avatar';
import { Caption } from './Text';

type Props = {
  avatars: string[];
  extra?: number;
  size?: number;
};

export function AvatarStack({ avatars, extra = 0, size = 32 }: Props) {
  return (
    <View className="flex-row items-center">
      {avatars.map((uri, i) => (
        <View key={uri} style={{ marginLeft: i === 0 ? 0 : -size * 0.35 }}>
          <Avatar uri={uri} size={size} ring />
        </View>
      ))}
      {extra > 0 && (
        <View
          style={{ width: size, height: size, marginLeft: -size * 0.35 }}
          className="rounded-full bg-ink border-2 border-white dark:border-surface-dark items-center justify-center"
        >
          <Caption className="text-white">+{extra}</Caption>
        </View>
      )}
    </View>
  );
}
