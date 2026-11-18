import React, { useState } from 'react';
import { Modal, Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Minus, Plus, X } from 'lucide-react-native';
import { KeyboardAvoidingView } from '@/components/ui/KeyboardSafe';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { IconButton } from '@/components/ui/IconButton';
import { PrimaryButton } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { Caption, H2 } from '@/components/ui/Text';
import { colors, softShadowLg } from '@/lib/theme';
import { haptic } from '@/lib/haptics';

const MAX_OPTIONS = 4;
const MIN_OPTIONS = 2;

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (question: string, options: string[]) => void;
};

export function PollCreateSheet({ visible, onClose, onSubmit }: Props) {
  const insets = useSafeAreaInsets();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);

  const reset = () => {
    setQuestion('');
    setOptions(['', '']);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const updateOption = (i: number, value: string) => {
    setOptions((prev) => prev.map((o, idx) => (idx === i ? value : o)));
  };

  const addOption = () => {
    if (options.length >= MAX_OPTIONS) return;
    haptic.tap();
    setOptions((prev) => [...prev, '']);
  };

  const removeOption = (i: number) => {
    if (options.length <= MIN_OPTIONS) return;
    haptic.select();
    setOptions((prev) => prev.filter((_, idx) => idx !== i));
  };

  const validOptions = options.map((o) => o.trim()).filter(Boolean);
  const canSubmit = question.trim().length > 0 && validOptions.length >= MIN_OPTIONS;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit(question.trim(), validOptions);
    reset();
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <Pressable className="flex-1 bg-black/40 justify-end" onPress={handleClose}>
      <Pressable
        style={[softShadowLg, { paddingBottom: insets.bottom + 20 }]}
        className="bg-white dark:bg-surface-dark rounded-t-[32px] px-5 pt-5"
      >
        <View className="flex-row items-center justify-between mb-4">
          <View style={{ width: 36 }} />
          <H2>Create Poll</H2>
          <IconButton size={36} onPress={handleClose}>
            <X size={18} color={colors.ink} />
          </IconButton>
        </View>

        <Caption className="mb-2">Question</Caption>
        <View className="rounded-input bg-background dark:bg-background-dark border border-border-light dark:border-border-dark px-4 mb-4">
          <TextInput
            placeholder="What do you want to ask?"
            placeholderTextColor={colors.textSecondary}
            value={question}
            onChangeText={setQuestion}
            className="py-3.5 font-poppins text-body text-text-primary dark:text-text-primary-dark"
          />
        </View>

        <Caption className="mb-2">Options</Caption>
        {/* Rows are keyed by index, so the initial pair cascades in with the sheet and each
            newly-added option springs in at the bottom; existing rows are left untouched. */}
        {options.map((opt, i) => (
          <Reveal key={i} index={i} spring className="flex-row items-center mb-2.5">
            <View className="flex-1 rounded-input bg-background dark:bg-background-dark border border-border-light dark:border-border-dark px-4">
              <TextInput
                placeholder={`Option ${i + 1}`}
                placeholderTextColor={colors.textSecondary}
                value={opt}
                onChangeText={(t) => updateOption(i, t)}
                className="py-3 font-poppins text-body text-text-primary dark:text-text-primary-dark"
              />
            </View>
            {options.length > MIN_OPTIONS && (
              <Reveal spring scaleIn step={0}>
                {/* removeOption already fires haptic.select, so haptics stay off here. */}
                <AnimatedPressable
                  onPress={() => removeOption(i)}
                  scaleTo={0.86}
                  haptics="none"
                  className="w-9 h-9 rounded-full items-center justify-center ml-2 bg-danger/15"
                >
                  <Minus size={16} color={colors.danger} />
                </AnimatedPressable>
              </Reveal>
            )}
          </Reveal>
        ))}

        {options.length < MAX_OPTIONS && (
          // addOption already fires haptic.tap, so haptics stay off here.
          <AnimatedPressable onPress={addOption} scaleTo={0.97} haptics="none" className="flex-row items-center mb-5 mt-1">
            <View className="w-7 h-7 rounded-full items-center justify-center bg-card-lavender dark:bg-card-lavender-dark mr-2">
              <Plus size={14} color={colors.primary} />
            </View>
            <Caption className="text-primary font-poppins-semibold">Add option</Caption>
          </AnimatedPressable>
        )}

        <PrimaryButton label="Create Poll" onPress={handleSubmit} disabled={!canSubmit} className="mt-2" />
      </Pressable>
      </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
