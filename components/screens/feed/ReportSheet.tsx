import React, { useState } from 'react';
import { Modal, Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, Circle, X } from 'lucide-react-native';
import { IconButton } from '@/components/ui/IconButton';
import { KeyboardAvoidingView } from '@/components/ui/KeyboardSafe';
import { PrimaryButton } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { Body, Caption, H2 } from '@/components/ui/Text';
import { useToast } from '@/components/ui/Toast';
import { haptic } from '@/lib/haptics';
import { colors, softShadowLg } from '@/lib/theme';
import { reportPost, type ReportReason } from '@/lib/api/posts';
import { ApiRequestError } from '@/lib/api/client';

const REASONS: ReportReason[] = ['Spam', 'Inappropriate', 'Harassment', 'Other'];

type Props = {
  visible: boolean;
  onClose: () => void;
  postId: string;
};

export function ReportSheet({ visible, onClose, postId }: Props) {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    setReason(null);
    setDetails('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!reason || submitting) return;
    setSubmitting(true);
    try {
      await reportPost(postId, reason, reason === 'Other' ? details.trim() || undefined : undefined);
      toast('Report submitted');
      haptic.success();
      handleClose();
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : 'Could not submit the report';
      toast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <Pressable className="flex-1 bg-black/40 justify-end" onPress={handleClose}>
      <Pressable
        style={[softShadowLg, { paddingBottom: insets.bottom + 20 }]}
        className="bg-white dark:bg-surface-dark rounded-t-[32px] px-5 pt-5"
      >
        <View className="flex-row items-center justify-between mb-2">
          <View style={{ width: 36 }} />
          <H2>Report Post</H2>
          <IconButton size={36} onPress={handleClose}>
            <X size={18} color={colors.ink} />
          </IconButton>
        </View>
        {REASONS.map((r, i) => {
          const selected = reason === r;
          return (
            <Reveal key={r} index={i} step={45} baseDelay={80}>
              <Pressable
                onPress={() => {
                  haptic.select();
                  setReason(r);
                }}
                className="flex-row items-center justify-between py-4 border-b border-border-light dark:border-border-dark"
              >
                <Body>{r}</Body>
                {selected ? (
                  <Reveal spring scaleIn>
                    <CheckCircle2 size={22} color={colors.primary} />
                  </Reveal>
                ) : (
                  <Circle size={22} color={colors.textSecondary} />
                )}
              </Pressable>
            </Reveal>
          );
        })}

        {reason === 'Other' && (
          <Reveal spring scaleIn className="mt-3">
            <Caption className="mb-2">Tell us more (optional)</Caption>
            <View className="rounded-input bg-background dark:bg-background-dark border border-border-light dark:border-border-dark px-4">
              <TextInput
                value={details}
                onChangeText={setDetails}
                placeholder="What's wrong with this post?"
                placeholderTextColor={colors.textSecondary}
                multiline
                textAlignVertical="top"
                className="py-3 font-poppins text-body text-text-primary dark:text-text-primary-dark"
                style={{ minHeight: 70 }}
              />
            </View>
          </Reveal>
        )}

        <PrimaryButton
          label={submitting ? 'Submitting…' : 'Submit Report'}
          onPress={handleSubmit}
          disabled={!reason || submitting}
          className="mt-6"
        />
      </Pressable>
      </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
