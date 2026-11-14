import React, { useState } from 'react';
import { FlatList, Modal, Pressable, View } from 'react-native';
import { Check, ChevronDown } from 'lucide-react-native';
import { BodyMedium, Body, Caption } from '@/components/ui/Text';
import { colors, softShadowLg } from '@/lib/theme';

type Props<T extends string> = {
  label: string;
  value: T;
  options: T[];
  onChange: (value: T) => void;
  className?: string;
};

/** Compact pill that opens a small modal list to pick a value. Purely cosmetic/local-state filter affordance. */
export function FilterPill<T extends string>({ label, value, options, onChange, className = '' }: Props<T>) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        className={`flex-row items-center justify-between bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-full px-4 py-2.5 ${className}`}
      >
        <BodyMedium numberOfLines={1} className="flex-1 mr-1">
          {value}
        </BodyMedium>
        <ChevronDown size={16} color={colors.textSecondary} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 bg-black/40 justify-center px-8" onPress={() => setOpen(false)}>
          <Pressable
            style={softShadowLg}
            className="bg-white dark:bg-surface-dark rounded-card overflow-hidden"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="px-4 pt-4 pb-2">
              <Caption>{label}</Caption>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              style={{ maxHeight: 320 }}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onChange(item);
                    setOpen(false);
                  }}
                  className="flex-row items-center justify-between px-4 py-3.5"
                >
                  <Body numberOfLines={1} className="flex-1 pr-3">
                    {item}
                  </Body>
                  {item === value && <Check size={18} color={colors.primary} />}
                </Pressable>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
