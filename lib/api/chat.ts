import { apiRequest } from './client';

export type PollOption = { id: string; label: string; votes: number; pct: number };

export type Poll = {
  id: string;
  question: string;
  closesAt: string | null;
  totalVotes: number;
  options: PollOption[];
  myVote: string | null;
};

export type ChatMessage = {
  id: string;
  groupChatId: string;
  createdAt: string;
  sender: { id: string; fullName: string; avatarUrl: string | null };
  text: string | null;
  image: string | null;
  poll: Poll | null;
};

export type GroupSummary = {
  id: string;
  name: string;
  isCommunity: boolean;
  iconUrl: string | null;
  memberCount: number;
  lastMessage: string | null;
  lastMessageAt: string;
  unreadCount: number;
};

export type GroupMeta = { id: string; name: string; isCommunity: boolean; iconUrl: string | null; memberCount: number };

export type GroupFile = { id: string; name: string; type: string; size: string; uploader: string; date: string; url: string };

export async function listMyGroups(): Promise<GroupSummary[]> {
  return apiRequest('/chat/groups', { auth: true });
}

export async function getGroupMeta(id: string): Promise<GroupMeta> {
  return apiRequest(`/chat/groups/${id}`, { auth: true });
}

export async function markGroupRead(id: string): Promise<void> {
  await apiRequest(`/chat/groups/${id}/read`, { method: 'POST', auth: true });
}

export async function listMessages(id: string): Promise<ChatMessage[]> {
  return apiRequest(`/chat/groups/${id}/messages`, { auth: true });
}

export async function sendMessage(id: string, input: { text?: string; assetId?: string }): Promise<ChatMessage> {
  return apiRequest(`/chat/groups/${id}/messages`, { method: 'POST', body: input, auth: true });
}

export async function listGroupFiles(id: string): Promise<GroupFile[]> {
  return apiRequest(`/chat/groups/${id}/files`, { auth: true });
}

export async function createPoll(
  id: string,
  input: { question: string; options: string[]; closesInHours?: number }
): Promise<ChatMessage> {
  return apiRequest(`/chat/groups/${id}/polls`, { method: 'POST', body: input, auth: true });
}

export async function votePoll(pollId: string, optionId: string): Promise<Poll> {
  return apiRequest(`/chat/polls/${pollId}/vote`, { method: 'POST', body: { optionId }, auth: true });
}

// --- Admin ---

export type AdminGroup = { id: string; name: string; iconUrl: string | null; memberCount: number; createdAt: string };

export async function listAllGroups(): Promise<AdminGroup[]> {
  return apiRequest('/chat/admin/groups', { auth: true });
}

export async function createGroup(input: { name: string; memberIds: string[]; iconAssetId?: string }): Promise<AdminGroup> {
  return apiRequest('/chat/admin/groups', { method: 'POST', body: input, auth: true });
}
