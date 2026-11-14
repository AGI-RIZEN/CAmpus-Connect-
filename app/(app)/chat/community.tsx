import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { KeyboardAvoidingView } from '@/components/ui/KeyboardSafe';
import * as ImagePicker from 'expo-image-picker';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { useToast } from '@/components/ui/Toast';
import { colors } from '@/lib/theme';
import { useAuth } from '@/lib/auth-context';
import { useGroupChat } from '@/lib/chat-hooks';
import { listMyGroups } from '@/lib/api/chat';
import { uploadFile } from '@/lib/api/uploads';
import { ApiRequestError } from '@/lib/api/client';
import { haptic } from '@/lib/haptics';
import { MessageBubble } from '@/components/screens/chat/MessageBubble';
import { Composer } from '@/components/screens/chat/Composer';
import { PollCreateSheet } from '@/components/screens/chat/PollCreateSheet';

export default function CommunityChatScreen() {
  const { user } = useAuth();
  const toast = useToast();
  const [communityId, setCommunityId] = useState<string | undefined>(undefined);
  const [draft, setDraft] = useState('');
  const [pollOpen, setPollOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    listMyGroups()
      .then((list) => setCommunityId(list.find((g) => g.isCommunity)?.id))
      .catch(() => {});
  }, []);

  const { messages, loading, sendText, sendImage, sendPoll, vote } = useGroupChat(communityId, (msg) => toast(msg, 'error'));

  useEffect(() => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }, [messages.length]);

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    haptic.tap();
    sendText(text);
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      toast('Photo library access is needed to send images', 'error');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (result.canceled || !result.assets[0]) return;

    setUploading(true);
    try {
      const upload = await uploadFile(result.assets[0]);
      await sendImage(upload.assetId);
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : 'Could not send that image';
      toast(message, 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Screen scroll={false} padded={false}>
      <View className="px-screen">
        <Header title="Campus Community" />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={8}>
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <ScrollView
            ref={scrollRef}
            className="flex-1"
            contentContainerClassName="pt-2 pb-4"
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
          >
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                mine={message.sender.id === user?.id}
                onVote={(pollId, optionId) => vote(pollId, optionId)}
              />
            ))}
            {uploading && (
              <View className="items-end mb-4 px-4">
                <ActivityIndicator color={colors.primary} />
              </View>
            )}
          </ScrollView>
        )}

        <View
          className="px-screen pt-3 border-t border-border-light dark:border-border-dark"
          style={{ paddingBottom: 72 }}
        >
          <Composer
            draft={draft}
            onChangeDraft={setDraft}
            onSend={handleSend}
            onPickImage={handlePickImage}
            onOpenPoll={() => setPollOpen(true)}
          />
        </View>
      </KeyboardAvoidingView>

      <PollCreateSheet
        visible={pollOpen}
        onClose={() => setPollOpen(false)}
        onSubmit={(question, options) => sendPoll(question, options)}
      />
    </Screen>
  );
}
