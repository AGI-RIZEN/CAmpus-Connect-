import { useCallback, useEffect, useState } from 'react';
import { getSocket } from './socket';
import * as chatApi from './api/chat';
import { ApiRequestError } from './api/client';

/** Loads a group's message history over REST, then stays live via Socket.io for the rest of
 *  the screen's lifetime — joining/leaving the group's room as the screen mounts/unmounts. */
export function useGroupChat(groupChatId: string | undefined, onError: (message: string) => void) {
  const [messages, setMessages] = useState<chatApi.ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupChatId) return;
    let active = true;
    setLoading(true);

    chatApi
      .listMessages(groupChatId)
      .then((list) => {
        if (active) setMessages(list);
      })
      .catch((err) => {
        onError(err instanceof ApiRequestError ? err.message : 'Could not load messages');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    chatApi.markGroupRead(groupChatId).catch(() => {});

    const socket = getSocket();
    if (!socket.connected) socket.connect();
    socket.emit('group:join', groupChatId);

    const onNewMessage = (msg: chatApi.ChatMessage) => {
      if (msg.groupChatId !== groupChatId) return;
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    };

    // Deliberately does NOT touch `myVote` — that broadcast payload is viewer-less (it goes to
    // every member in the room), so merging it wholesale would clobber the local voter's own
    // just-set choice back to null. Only the shared aggregate fields are safe to apply here.
    const onPollUpdate = (payload: chatApi.Poll & { groupChatId: string }) => {
      if (payload.groupChatId !== groupChatId) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.poll && m.poll.id === payload.id
            ? { ...m, poll: { ...m.poll, options: payload.options, totalVotes: payload.totalVotes, closesAt: payload.closesAt } }
            : m
        )
      );
    };

    socket.on('message:new', onNewMessage);
    socket.on('poll:update', onPollUpdate);

    return () => {
      active = false;
      socket.emit('group:leave', groupChatId);
      socket.off('message:new', onNewMessage);
      socket.off('poll:update', onPollUpdate);
    };
  }, [groupChatId]);

  const sendText = useCallback(
    async (text: string) => {
      if (!groupChatId) return;
      try {
        const msg = await chatApi.sendMessage(groupChatId, { text });
        setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      } catch (err) {
        onError(err instanceof ApiRequestError ? err.message : 'Could not send message');
      }
    },
    [groupChatId]
  );

  const sendImage = useCallback(
    async (assetId: string) => {
      if (!groupChatId) return;
      try {
        const msg = await chatApi.sendMessage(groupChatId, { assetId });
        setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      } catch (err) {
        onError(err instanceof ApiRequestError ? err.message : 'Could not send image');
      }
    },
    [groupChatId]
  );

  const sendPoll = useCallback(
    async (question: string, options: string[]) => {
      if (!groupChatId) return;
      try {
        const msg = await chatApi.createPoll(groupChatId, { question, options });
        setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      } catch (err) {
        onError(err instanceof ApiRequestError ? err.message : 'Could not create the poll');
      }
    },
    [groupChatId]
  );

  const vote = useCallback(async (pollId: string, optionId: string) => {
    try {
      const updated = await chatApi.votePoll(pollId, optionId);
      setMessages((prev) => prev.map((m) => (m.poll && m.poll.id === updated.id ? { ...m, poll: updated } : m)));
    } catch (err) {
      onError(err instanceof ApiRequestError ? err.message : 'Could not submit your vote');
    }
  }, []);

  return { messages, loading, sendText, sendImage, sendPoll, vote };
}
