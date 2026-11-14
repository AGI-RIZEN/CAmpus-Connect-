import React, { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, Circle, X } from 'lucide-react-native';
import { IconButton } from '@/components/ui/IconButton';
import { PrimaryButton } from '@/components/ui/Button';
import { Body, H2 } from '@/components/ui/Text';
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
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    setReason(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!reason || submitting) return;
    setSubmitting(true);
    try {
      await reportPost(postId, reason);
      toast('Report submitted');
      haptic.success();
      setReason(null);
      onClose();
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : 'Could not submit the report';
      toast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={handleClose}>
      <Pressable className="flex-1 bg-black/40" onPress={handleClose} />
      <View
        style={[softShadowLg, { paddingBottom: insets.bottom + 20 }]}
        className="absolute bottom-0 left-0 right-0 bg-white dark:bg-surface-dark rounded-t-[32px] px-5 pt-5"
      >
        <View className="flex-row items-center justify-between mb-2">
          <View style={{ width: 36 }} />
          <H2>Report Post</H2>
          <IconButton size={36} onPress={handleClose}>
            <X size={18} color={colors.ink} />
          </IconButton>
        </View>
        {REASONS.map((r) => {
          const selected = reason === r;
          return (
            <Pressable
              key={r}
              onPress={() => {
                haptic.select();
                setReason(r);
              }}
              className="flex-row items-center justify-between py-4 border-b border-border-light dark:border-border-dark"
            >
              <Body>{r}</Body>
              {selected ? <CheckCircle2 size={22} color={colors.primary} /> : <Circle size={22} color={colors.textSecondary} />}
            </Pressable>
          );
        })}
        <PrimaryButton
          label={submitting ? 'Submitting…' : 'Submit Report'}
          onPress={handleSubmit}
          disabled={!reason || submitting}
          className="mt-6"
        />
      </View>
    </Modal>
  );
}
