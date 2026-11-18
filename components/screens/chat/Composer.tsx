import React from 'react';
import { TextInput, View } from 'react-native';
import { BarChart2, Image as ImageIcon, Send } from 'lucide-react-native';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { colors } from '@/lib/theme';

type Props = {
  draft: string;
  onChangeDraft: (text: string) => void;
  onSend: () => void;
  onPickImage: () => void;
  onOpenPoll: () => void;
  sending?: boolean;
};

export function Composer({ draft, onChangeDraft, onSend, onPickImage, onOpenPoll, sending }: Props) {
  return (
    <View className="flex-row items-center">
      <AnimatedPressable
        scaleTo={0.86}
        haptics="select"
        className="w-10 h-10 items-center justify-center mr-1"
        onPress={onOpenPoll}
      >
        <BarChart2 size={22} color={colors.textSecondary} />
      </AnimatedPressable>
      <AnimatedPressable
        scaleTo={0.86}
        haptics="select"
        className="w-10 h-10 items-center justify-center mr-1"
        onPress={onPickImage}
      >
        <ImageIcon size={22} color={colors.textSecondary} />
      </AnimatedPressable>
      <View className="flex-1 flex-row items-center bg-white dark:bg-surface-dark rounded-full px-4 border border-border-light dark:border-border-dark">
        <TextInput
          value={draft}
          onChangeText={onChangeDraft}
          placeholder="Type a message..."
          placeholderTextColor={colors.textSecondary}
          className="flex-1 py-3 font-poppins text-body text-text-primary dark:text-text-primary-dark"
          multiline
        />
      </View>
      {/* Screens already fire haptic.tap() inside their onSend, so haptics stay off here to
          avoid a double buzz; `lift` gives the primary-tinted glow bloom on release. */}
      <AnimatedPressable
        onPress={onSend}
        disabled={sending}
        lift
        scaleTo={0.9}
        haptics="none"
        className={`w-11 h-11 rounded-full bg-primary items-center justify-center ml-2 ${sending ? 'opacity-50' : ''}`}
      >
        <Send size={18} color="#fff" />
      </AnimatedPressable>
    </View>
  );
}
