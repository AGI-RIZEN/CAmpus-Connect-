import type { Asset, GroupChat, Message, Poll, PollOption, PollVote, User } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { ApiError } from '../../middleware/errorHandler';
import { emitToGroup } from '../../sockets/emitter';

type PollWithOptions = Poll & { options: (PollOption & { votes: PollVote[] })[] };

type MessageWithRelations = Message & {
  sender: User & { avatarAsset: Asset | null };
  asset: Asset | null;
  poll: PollWithOptions | null;
};

const messageInclude = {
  sender: { include: { avatarAsset: true } },
  asset: true,
  poll: { include: { options: { include: { votes: true } } } },
} as const;

/** `requesterId` omitted (e.g. for a socket broadcast meant for every member) means the
 *  viewer-specific `myVote` field is left out entirely, rather than leaking one voter's choice
 *  to everyone else in the room. */
function publicPoll(poll: PollWithOptions, requesterId?: string) {
  const totalVotes = poll.options.reduce((sum, o) => sum + o.votes.length, 0);
  let myVote: string | null = null;

  const options = poll.options.map((o) => {
    if (requesterId && o.votes.some((v) => v.userId === requesterId)) myVote = o.id;
    return {
      id: o.id,
      label: o.label,
      votes: o.votes.length,
      pct: totalVotes > 0 ? Math.round((o.votes.length / totalVotes) * 100) : 0,
    };
  });

  return { id: poll.id, question: poll.question, closesAt: poll.closesAt, totalVotes, options, myVote };
}

function publicMessage(msg: MessageWithRelations, requesterId?: string) {
  return {
    id: msg.id,
    groupChatId: msg.groupChatId,
    createdAt: msg.createdAt,
    sender: { id: msg.sender.id, fullName: msg.sender.fullName, avatarUrl: msg.sender.avatarAsset?.secureUrl ?? null },
    text: msg.text,
    image: msg.asset?.secureUrl ?? null,
    poll: msg.poll ? publicPoll(msg.poll, requesterId) : null,
  };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function summarizeLastMessage(msg: { text: string | null; assetId: string | null; pollId: string | null; sender: { fullName: string } }) {
  const prefix = `${msg.sender.fullName.split(' ')[0]}: `;
  if (msg.pollId) return `${prefix}📊 Poll`;
  if (msg.assetId) return `${prefix}📷 Photo`;
  return `${prefix}${msg.text ?? ''}`;
}

/** The single campus-wide room, lazily bootstrapped on first access rather than seeded —
 *  whoever happens to open Chat first becomes its nominal creator (the FK just needs *someone*). */
async function getOrCreateCommunityGroup(fallbackCreatorId: string): Promise<GroupChat> {
  const existing = await prisma.groupChat.findFirst({ where: { isCommunity: true } });
  if (existing) return existing;

  return prisma.groupChat.create({
    data: { name: 'Campus Community', isCommunity: true, createdById: fallbackCreatorId },
  });
}

async function ensureCommunityMembership(userId: string, communityId: string) {
  await prisma.groupMembership.upsert({
    where: { userId_groupChatId: { userId, groupChatId: communityId } },
    update: {},
    create: { userId, groupChatId: communityId },
  });
}

/** Community chat is open to any authenticated user; a created group requires real membership. */
async function assertGroupAccess(userId: string, groupChatId: string): Promise<GroupChat> {
  const chat = await prisma.groupChat.findUnique({ where: { id: groupChatId } });
  if (!chat) throw new ApiError(404, 'Group not found');
  if (chat.isCommunity) return chat;

  const membership = await prisma.groupMembership.findUnique({
    where: { userId_groupChatId: { userId, groupChatId } },
  });
  if (!membership) throw new ApiError(403, "You're not a member of this group");
  return chat;
}

export async function listMyGroups(userId: string) {
  const community = await getOrCreateCommunityGroup(userId);
  await ensureCommunityMembership(userId, community.id);

  const memberships = await prisma.groupMembership.findMany({
    where: { userId },
    include: {
      groupChat: {
        include: {
          iconAsset: true,
          _count: { select: { memberships: true } },
          messages: { orderBy: { createdAt: 'desc' }, take: 1, include: { sender: true } },
        },
      },
    },
  });

  const results = await Promise.all(
    memberships.map(async (m) => {
      const chat = m.groupChat;
      const lastMsg = chat.messages[0];
      const unreadCount = await prisma.message.count({
        where: {
          groupChatId: chat.id,
          createdAt: { gt: m.lastReadAt ?? new Date(0) },
          senderId: { not: userId },
        },
      });
      return {
        id: chat.id,
        name: chat.name,
        isCommunity: chat.isCommunity,
        iconUrl: chat.iconAsset?.secureUrl ?? null,
        memberCount: chat._count.memberships,
        lastMessage: lastMsg ? summarizeLastMessage(lastMsg) : null,
        lastMessageAt: (lastMsg?.createdAt ?? chat.createdAt).toISOString(),
        unreadCount,
      };
    })
  );

  return results.sort((a, b) => {
    if (a.isCommunity !== b.isCommunity) return a.isCommunity ? -1 : 1;
    return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
  });
}

export async function getGroupMeta(userId: string, groupChatId: string) {
  const chat = await assertGroupAccess(userId, groupChatId);
  const [memberCount, iconAsset] = await Promise.all([
    prisma.groupMembership.count({ where: { groupChatId } }),
    chat.iconAssetId ? prisma.asset.findUnique({ where: { id: chat.iconAssetId } }) : Promise.resolve(null),
  ]);
  return { id: chat.id, name: chat.name, isCommunity: chat.isCommunity, iconUrl: iconAsset?.secureUrl ?? null, memberCount };
}

export async function listMessages(userId: string, groupChatId: string, params: { before?: string; limit: number }) {
  await assertGroupAccess(userId, groupChatId);

  const where: Record<string, unknown> = { groupChatId };
  if (params.before) where.createdAt = { lt: new Date(params.before) };

  const messages = await prisma.message.findMany({
    where,
    include: messageInclude,
    orderBy: { createdAt: 'desc' },
    take: params.limit,
  });

  return messages.reverse().map((m) => publicMessage(m, userId));
}

export async function sendMessage(userId: string, groupChatId: string, input: { text?: string; assetId?: string }) {
  await assertGroupAccess(userId, groupChatId);

  const message = await prisma.message.create({
    data: { groupChatId, senderId: userId, text: input.text?.trim() || null, assetId: input.assetId ?? null },
    include: messageInclude,
  });

  emitToGroup(groupChatId, 'message:new', publicMessage(message));
  return publicMessage(message, userId);
}

export async function createPoll(
  userId: string,
  groupChatId: string,
  input: { question: string; options: string[]; closesInHours?: number }
) {
  await assertGroupAccess(userId, groupChatId);

  const closesAt = input.closesInHours ? new Date(Date.now() + input.closesInHours * 60 * 60 * 1000) : null;

  const poll = await prisma.poll.create({
    data: {
      question: input.question,
      createdById: userId,
      closesAt,
      options: { create: input.options.map((label) => ({ label })) },
    },
  });

  const message = await prisma.message.create({
    data: { groupChatId, senderId: userId, pollId: poll.id },
    include: messageInclude,
  });

  emitToGroup(groupChatId, 'message:new', publicMessage(message));
  return publicMessage(message, userId);
}

export async function votePoll(userId: string, pollId: string, optionId: string) {
  const poll = await prisma.poll.findUnique({ where: { id: pollId }, include: { message: true, options: true } });
  if (!poll) throw new ApiError(404, 'Poll not found');
  if (!poll.message) throw new ApiError(500, 'Poll is not attached to a message');
  if (poll.closesAt && poll.closesAt < new Date()) throw new ApiError(409, 'This poll has closed');
  if (!poll.options.some((o) => o.id === optionId)) throw new ApiError(400, 'Invalid option');

  const groupChatId = poll.message.groupChatId;
  await assertGroupAccess(userId, groupChatId);

  await prisma.pollVote.upsert({
    where: { userId_pollId: { userId, pollId } },
    update: { pollOptionId: optionId },
    create: { userId, pollId, pollOptionId: optionId },
  });

  const updated = await prisma.poll.findUnique({
    where: { id: pollId },
    include: { options: { include: { votes: true } } },
  });
  if (!updated) throw new ApiError(404, 'Poll not found');

  emitToGroup(groupChatId, 'poll:update', { groupChatId, ...publicPoll(updated) });
  return publicPoll(updated, userId);
}

export async function markGroupRead(userId: string, groupChatId: string) {
  await assertGroupAccess(userId, groupChatId);
  await prisma.groupMembership.upsert({
    where: { userId_groupChatId: { userId, groupChatId } },
    update: { lastReadAt: new Date() },
    create: { userId, groupChatId, lastReadAt: new Date() },
  });
}

export async function listGroupFiles(userId: string, groupChatId: string) {
  await assertGroupAccess(userId, groupChatId);

  const messages = await prisma.message.findMany({
    where: { groupChatId, assetId: { not: null } },
    include: { asset: true, sender: true },
    orderBy: { createdAt: 'desc' },
  });

  return messages
    .filter((m) => m.asset)
    .map((m) => ({
      id: m.asset!.id,
      name: `${m.asset!.cloudinaryPublicId.split('/').pop()}.${m.asset!.format ?? 'jpg'}`,
      type: m.asset!.resourceType,
      size: formatBytes(m.asset!.bytes),
      uploader: m.sender.fullName,
      date: m.createdAt,
      url: m.asset!.secureUrl,
    }));
}

export async function createGroup(creatorId: string, input: { name: string; memberIds: string[]; iconAssetId?: string }) {
  const chat = await prisma.groupChat.create({
    data: {
      name: input.name,
      isCommunity: false,
      createdById: creatorId,
      iconAssetId: input.iconAssetId ?? null,
      memberships: {
        create: [
          { userId: creatorId, isAdmin: true },
          ...input.memberIds.filter((id) => id !== creatorId).map((userId) => ({ userId, isAdmin: false })),
        ],
      },
    },
    include: { iconAsset: true, _count: { select: { memberships: true } } },
  });

  return {
    id: chat.id,
    name: chat.name,
    iconUrl: chat.iconAsset?.secureUrl ?? null,
    memberCount: chat._count.memberships,
    createdAt: chat.createdAt,
  };
}

export async function listAllGroups() {
  const chats = await prisma.groupChat.findMany({
    where: { isCommunity: false },
    include: { iconAsset: true, _count: { select: { memberships: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return chats.map((c) => ({
    id: c.id,
    name: c.name,
    iconUrl: c.iconAsset?.secureUrl ?? null,
    memberCount: c._count.memberships,
    createdAt: c.createdAt,
  }));
}
