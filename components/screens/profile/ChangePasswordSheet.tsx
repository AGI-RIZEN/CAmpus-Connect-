import React, { useState } from 'react';
import { Modal, Pressable, TextInput, View } from 'react-native';
import { X } from 'lucide-react-native';
import { KeyboardAvoidingView } from '@/components/ui/KeyboardSafe';
import { H2, Caption } from '@/components/ui/Text';
import { PrimaryButton } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { useToast } from '@/components/ui/Toast';
import { colors } from '@/lib/theme';
import { changePassword } from '@/lib/api/auth';
import { ApiRequestError } from '@/lib/api/client';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function ChangePasswordSheet({ visible, onClose }: Props) {
  const toast = useToast();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setOldPassword('');
    setNewPassword('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const canSubmit = oldPassword.length > 0 && newPassword.length >= 6 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await changePassword(oldPassword, newPassword);
      toast('Password updated');
      handleClose();
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : 'Could not update your password';
      toast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <Pressable className="flex-1 bg-black/40 justify-end" onPress={handleClose}>
          <Pressable className="bg-white dark:bg-surface-dark rounded-t-[32px] px-screen pt-6 pb-10">
            <View className="flex-row items-center justify-between mb-4">
              <H2>Change Password</H2>
              <IconButton size={36} onPress={handleClose}>
                <X size={18} color={colors.ink} />
              </IconButton>
            </View>

            <Caption className="mb-2">Current password</Caption>
            <View className="rounded-input bg-background dark:bg-background-dark border border-border-light dark:border-border-dark px-4 mb-4">
              <TextInput
                value={oldPassword}
                onChangeText={setOldPassword}
                placeholder="Enter current password"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
                className="py-3.5 font-poppins text-body text-text-primary dark:text-text-primary-dark"
              />
            </View>

            <Caption className="mb-2">New password</Caption>
            <View className="rounded-input bg-background dark:bg-background-dark border border-border-light dark:border-border-dark px-4 mb-2">
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="At least 6 characters"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
                className="py-3.5 font-poppins text-body text-text-primary dark:text-text-primary-dark"
              />
            </View>
            <Caption className="mb-5 text-text-secondary dark:text-text-secondary-dark">
              Must be at least 6 characters.
            </Caption>

            <PrimaryButton
              label={submitting ? 'Updating…' : 'Update Password'}
              onPress={handleSubmit}
              disabled={!canSubmit}
            />
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
