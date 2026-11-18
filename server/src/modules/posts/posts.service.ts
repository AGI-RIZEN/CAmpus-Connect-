import type { Asset, Comment, Post, PostImage, ReportReason, Role, User } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { ApiError } from '../../middleware/errorHandler';

type Requester = { id: string; role: Role };

type PostWithRelations = Post & {
  author: User & { avatarAsset: Asset | null };
  images: (PostImage & { asset: Asset })[];
  _count: { likes: number; comments: number };
  likes: { userId: string }[];
  savedBy: { userId: string }[];
};

function postInclude(requesterId: string) {
  return {
    author: { include: { avatarAsset: true } },
    images: { include: { asset: true } },
    _count: { select: { likes: true, comments: true } },
    likes: { where: { userId: requesterId }, select: { userId: true } },
    savedBy: { where: { userId: requesterId }, select: { userId: true } },
  } as const;
}

function publicPost(post: PostWithRelations) {
  return {
    id: post.id,
    caption: post.caption,
    status: post.status,
    rejectedReason: post.rejectedReason,
    author: {
      id: post.author.id,
      fullName: post.author.fullName,
      avatarUrl: post.author.avatarAsset?.secureUrl ?? null,
      course: post.author.course,
    },
    images: [...post.images]
      .sort((a, b) => a.position - b.position)
      .map((img) => ({ id: img.id, url: img.asset.secureUrl })),
    likesCount: post._count.likes,
    commentsCount: post._count.comments,
    liked: post.likes.length > 0,
    saved: post.savedBy.length > 0,
    createdAt: post.createdAt,
  };
}

type ModerationPost = Post & {
  author: User & { avatarAsset: Asset | null };
  images: (PostImage & { asset: Asset })[];
  _count: { likes: number; comments: number };
};

function publicModerationPost(post: ModerationPost) {
  return {
    id: post.id,
    caption: post.caption,
    status: post.status,
    rejectedReason: post.rejectedReason,
    author: {
      id: post.author.id,
      fullName: post.author.fullName,
      avatarUrl: post.author.avatarAsset?.secureUrl ?? null,
      course: post.author.course,
    },
    images: [...post.images]
      .sort((a, b) => a.position - b.position)
      .map((img) => ({ id: img.id, url: img.asset.secureUrl })),
    likesCount: post._count.likes,
    commentsCount: post._count.comments,
    createdAt: post.createdAt,
  };
}

async function getPostOrThrow(id: string) {
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) throw new ApiError(404, 'Post not found');
  return post;
}

export async function listFeed(requester: Requester, params: { scope: 'forYou' | 'popular' | 'myCourse' }) {
  const where: Record<string, unknown> = { status: 'Approved' };

  if (params.scope === 'myCourse') {
    const me = await prisma.user.findUnique({ where: { id: requester.id }, select: { course: true } });
    where.author = { course: me?.course ?? '__none__' };
  }

  const posts = await prisma.post.findMany({
    where,
    include: postInclude(requester.id),
    orderBy: params.scope === 'popular' ? [{ likes: { _count: 'desc' } }, { createdAt: 'desc' }] : { createdAt: 'desc' },
    take: 100,
  });

  return posts.map(publicPost);
}

export async function listMine(requesterId: string) {
  const posts = await prisma.post.findMany({
    where: { authorId: requesterId },
    include: postInclude(requesterId),
    orderBy: { createdAt: 'desc' },
  });
  return posts.map(publicPost);
}

export async function createPost(authorId: string, input: { caption: string; imageAssetIds: string[] }) {
  const post = await prisma.post.create({
    data: {
      authorId,
      caption: input.caption,
      images: { create: input.imageAssetIds.map((assetId, i) => ({ assetId, position: i })) },
    },
    include: postInclude(authorId),
  });
  return publicPost(post);
}

export async function toggleLike(requesterId: string, postId: string) {
  const post = await getPostOrThrow(postId);
  const existing = await prisma.like.findUnique({ where: { userId_postId: { userId: requesterId, postId } } });

  if (existing) {
    await prisma.like.delete({ where: { userId_postId: { userId: requesterId, postId } } });
  } else {
    await prisma.like.create({ data: { userId: requesterId, postId } });
    if (post.authorId !== requesterId) {
      const liker = await prisma.user.findUnique({ where: { id: requesterId }, select: { fullName: true } });
      await prisma.notification
        .create({
          data: {
            userId: post.authorId,
            type: 'like',
            title: 'New like',
            body: `${liker?.fullName ?? 'Someone'} liked your post`,
          },
        })
        .catch(() => {});
    }
  }

  const likesCount = await prisma.like.count({ where: { postId } });
  return { liked: !existing, likesCount };
}

export async function toggleSave(requesterId: string, postId: string) {
  await getPostOrThrow(postId);
  const existing = await prisma.savedPost.findUnique({ where: { userId_postId: { userId: requesterId, postId } } });

  if (existing) {
    await prisma.savedPost.delete({ where: { userId_postId: { userId: requesterId, postId } } });
  } else {
    await prisma.savedPost.create({ data: { userId: requesterId, postId } });
  }

  return { saved: !existing };
}

type CommentWithRelations = Comment & {
  author: User & { avatarAsset: Asset | null };
  _count: { likes: number };
  likes: { userId: string }[];
};

function publicComment(c: CommentWithRelations) {
  return {
    id: c.id,
    text: c.text,
    author: { id: c.author.id, fullName: c.author.fullName, avatarUrl: c.author.avatarAsset?.secureUrl ?? null },
    likesCount: c._count.likes,
    liked: c.likes.length > 0,
    createdAt: c.createdAt,
  };
}

function commentInclude(requesterId: string) {
  return {
    author: { include: { avatarAsset: true } },
    _count: { select: { likes: true } },
    likes: { where: { userId: requesterId }, select: { userId: true } },
  } as const;
}

export async function listComments(requesterId: string, postId: string) {
  await getPostOrThrow(postId);
  const comments = await prisma.comment.findMany({
    where: { postId },
    include: commentInclude(requesterId),
    orderBy: { createdAt: 'asc' },
  });
  return comments.map(publicComment);
}

export async function addComment(requesterId: string, postId: string, text: string) {
  const post = await getPostOrThrow(postId);
  const comment = await prisma.comment.create({
    data: { postId, authorId: requesterId, text },
    include: commentInclude(requesterId),
  });

  if (post.authorId !== requesterId) {
    await prisma.notification
      .create({
        data: {
          userId: post.authorId,
          type: 'comment',
          title: 'New comment',
          body: `${comment.author.fullName} commented: ${text.slice(0, 80)}`,
        },
      })
      .catch(() => {});
  }

  return publicComment(comment);
}

export async function toggleCommentLike(requesterId: string, commentId: string) {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw new ApiError(404, 'Comment not found');

  const existing = await prisma.commentLike.findUnique({
    where: { userId_commentId: { userId: requesterId, commentId } },
  });

  if (existing) {
    await prisma.commentLike.delete({ where: { userId_commentId: { userId: requesterId, commentId } } });
  } else {
    await prisma.commentLike.create({ data: { userId: requesterId, commentId } });
  }

  const likesCount = await prisma.commentLike.count({ where: { commentId } });
  return { liked: !existing, likesCount };
}

export async function reportPost(requesterId: string, postId: string, reason: ReportReason, details?: string) {
  await getPostOrThrow(postId);

  const existing = await prisma.report.findFirst({
    where: { postId, reportedById: requesterId, status: 'Open' },
  });
  if (existing) return;

  await prisma.report.create({ data: { postId, reportedById: requesterId, reason, details } });

  try {
    const admins = await prisma.user.findMany({ where: { role: 'Admin', status: 'Active' }, select: { id: true } });
    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((a) => ({
          userId: a.id,
          type: 'post_reported',
          title: 'Post reported',
          body: `A post was reported for ${reason}`,
        })),
      });
    }
  } catch (err) {
    console.error('[notifications] failed to notify admins of report (non-fatal):', (err as Error).message);
  }
}

export async function listPendingPosts() {
  const posts = await prisma.post.findMany({
    where: { status: 'Pending' },
    include: {
      author: { include: { avatarAsset: true } },
      images: { include: { asset: true } },
      _count: { select: { likes: true, comments: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
  return posts.map(publicModerationPost);
}

export async function approvePost(postId: string) {
  const post = await getPostOrThrow(postId);
  if (post.status !== 'Pending') {
    throw new ApiError(409, `Can't approve: post is currently ${post.status}, not Pending`);
  }

  const updated = await prisma.post.update({ where: { id: postId }, data: { status: 'Approved' } });

  await prisma.notification
    .create({
      data: { userId: updated.authorId, type: 'post_approved', title: 'Post approved', body: 'Your post is now live on the feed.' },
    })
    .catch(() => {});

  return { id: updated.id, status: updated.status };
}

export async function rejectPost(postId: string, reason: string) {
  const post = await getPostOrThrow(postId);
  if (post.status !== 'Pending') {
    throw new ApiError(409, `Can't reject: post is currently ${post.status}, not Pending`);
  }

  const updated = await prisma.post.update({
    where: { id: postId },
    data: { status: 'Rejected', rejectedReason: reason },
  });

  await prisma.notification
    .create({ data: { userId: updated.authorId, type: 'post_rejected', title: 'Post rejected', body: reason } })
    .catch(() => {});

  return { id: updated.id, status: updated.status };
}

export async function listOpenReports() {
  const openReports = await prisma.report.findMany({
    where: { status: 'Open' },
    include: {
      reportedBy: { select: { id: true, fullName: true } },
      post: {
        include: {
          author: { include: { avatarAsset: true } },
          images: { include: { asset: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const byPost = new Map<string, typeof openReports>();
  for (const r of openReports) {
    const list = byPost.get(r.postId) ?? [];
    list.push(r);
    byPost.set(r.postId, list);
  }

  return [...byPost.entries()].map(([postId, reportsForPost]) => {
    const post = reportsForPost[0].post;
    return {
      postId,
      post: {
        id: post.id,
        caption: post.caption,
        author: { id: post.author.id, fullName: post.author.fullName, avatarUrl: post.author.avatarAsset?.secureUrl ?? null },
        image: [...post.images].sort((a, b) => a.position - b.position)[0]?.asset.secureUrl ?? null,
      },
      reportedByCount: reportsForPost.length,
      reasons: [...new Set(reportsForPost.map((r) => r.reason))],
      latestReportAt: reportsForPost[0].createdAt,
      reports: reportsForPost.map((r) => ({
        id: r.id,
        reason: r.reason,
        details: r.details,
        reportedBy: { id: r.reportedBy.id, fullName: r.reportedBy.fullName },
        createdAt: r.createdAt,
      })),
    };
  });
}

export async function dismissReports(postId: string) {
  await prisma.report.updateMany({
    where: { postId, status: 'Open' },
    data: { status: 'Dismissed', resolvedAt: new Date() },
  });
}

export async function actionReports(postId: string, reason: string) {
  const post = await getPostOrThrow(postId);

  await prisma.$transaction([
    prisma.post.update({ where: { id: postId }, data: { status: 'Rejected', rejectedReason: reason } }),
    prisma.report.updateMany({ where: { postId, status: 'Open' }, data: { status: 'ActionTaken', resolvedAt: new Date() } }),
  ]);

  await prisma.notification
    .create({ data: { userId: post.authorId, type: 'post_rejected', title: 'Post removed', body: reason } })
    .catch(() => {});
}
