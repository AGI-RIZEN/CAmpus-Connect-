import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { KeyboardAvoidingView } from '@/components/ui/KeyboardSafe';
import { useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Users } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Chip } from '@/components/ui/Chip';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { H2, Caption } from '@/components/ui/Text';
import { Reveal } from '@/components/ui/Reveal';
import { useToast } from '@/components/ui/Toast';
import { colors } from '@/lib/theme';
import { useAuth } from '@/lib/auth-context';
import { useGroupChat } from '@/lib/chat-hooks';
import { getGroupMeta, listGroupFiles, type GroupMeta, type GroupFile } from '@/lib/api/chat';
import { uploadFile } from '@/lib/api/uploads';
import { haptic } from '@/lib/haptics';
import { formatDate } from '@/lib/time';
import { MessageBubble } from '@/components/screens/chat/MessageBubble';
import { Composer } from '@/components/screens/chat/Composer';
import { PollCreateSheet } from '@/components/screens/chat/PollCreateSheet';
import { FileRow } from '@/components/screens/chat/FileRow';
import { PollCard } from '@/components/screens/chat/PollCard';
import { ApiRequestError } from '@/lib/api/client';

type TabKey = 'chat' | 'files' | 'polls';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'chat', label: 'Chat' },
  { key: 'files', label: 'Files' },
  { key: 'polls', label: 'Polls' },
];

export default function GroupChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState<TabKey>('chat');
  const [meta, setMeta] = useState<GroupMeta | null>(null);
  const [files, setFiles] = useState<GroupFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [pollOpen, setPollOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const { messages, loading, sendText, sendImage, sendPoll, vote } = useGroupChat(id, (msg) => toast(msg, 'error'));

  useEffect(() => {
    if (!id) return;
    getGroupMeta(id)
      .then(setMeta)
      .catch((err) => {
        const message = err instanceof ApiRequestError ? err.message : 'Could not load this group';
        toast(message, 'error');
      });
  }, [id]);

  const loadFiles = useCallback(async () => {
    if (!id) return;
    try {
      setFiles(await listGroupFiles(id));
    } catch {
      // Files tab staying empty on failure is acceptable — chat itself still works.
    } finally {
      setFilesLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (tab === 'files') loadFiles();
  }, [tab, loadFiles]);

  useEffect(() => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }, [messages.length]);

  const polls = messages.filter((m) => m.poll).map((m) => m.poll!);

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
        <Header title={meta?.name ?? 'Group'} />
        <View className="flex-row items-center justify-between mb-3 -mt-1">
          <View className="flex-row">
            {tabs.map((t) => (
              <Chip key={t.key} label={t.label} active={tab === t.key} onPress={() => setTab(t.key)} />
            ))}
          </View>
          {meta && (
            <View className="flex-row items-center">
              <Users size={14} color={colors.textSecondary} />
              <Caption className="ml-1.5">{meta.memberCount}</Caption>
            </View>
          )}
        </View>
      </View>

      {tab === 'chat' && (
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
      )}

      {tab === 'files' && (
        <ScrollView
          className="px-screen flex-1"
          contentContainerClassName="pt-1 pb-8"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row items-center justify-between mb-3">
            <H2>Shared Files</H2>
            <Caption>{files.length} files</Caption>
          </View>
          {filesLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : files.length === 0 ? (
            <EmptyState
              icon={<Users size={32} color={colors.primary} />}
              title="No files yet"
              description="Images shared in this group will show up here."
            />
          ) : (
            files.map((file, i) => (
              <Reveal key={file.id} index={i}>
                <FileRow file={{ ...file, date: formatDate(file.date) }} />
              </Reveal>
            ))
          )}
        </ScrollView>
      )}

      {tab === 'polls' && (
        <ScrollView
          className="px-screen flex-1"
          contentContainerClassName="pt-1 pb-8"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row items-center justify-between mb-3">
            <H2>Polls</H2>
            <Caption>{polls.length} total</Caption>
          </View>
          {polls.length === 0 ? (
            <EmptyState
              icon={<Users size={32} color={colors.primary} />}
              title="No polls yet"
              description="Create one from the chat composer."
            />
          ) : (
            polls.map((poll) => (
              <Card key={poll.id} tone="white" className="mb-4">
                <PollCard poll={poll} large onVote={(optionId) => vote(poll.id, optionId)} />
              </Card>
            ))
          )}
        </ScrollView>
      )}

      <PollCreateSheet
        visible={pollOpen}
        onClose={() => setPollOpen(false)}
        onSubmit={(question, options) => sendPoll(question, options)}
      />
    </Screen>
  );
}
