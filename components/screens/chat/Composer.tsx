import React from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { BarChart2, Image as ImageIcon, Send } from 'lucide-react-native';
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
      <Pressable className="w-10 h-10 items-center justify-center mr-1" onPress={onOpenPoll}>
        <BarChart2 size={22} color={colors.textSecondary} />
      </Pressable>
      <Pressable className="w-10 h-10 items-center justify-center mr-1" onPress={onPickImage}>
        <ImageIcon size={22} color={colors.textSecondary} />
      </Pressable>
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
      <Pressable
        onPress={onSend}
        disabled={sending}
        className={`w-11 h-11 rounded-full bg-primary items-center justify-center ml-2 ${sending ? 'opacity-50' : ''}`}
      >
        <Send size={18} color="#fff" />
      </Pressable>
    </View>
  );
}
