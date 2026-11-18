import type { Notice, NoticeCategory, Role, User, Asset } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { ApiError } from '../../middleware/errorHandler';
import { sendExpoPushNotifications } from '../../config/expoPush';

type NoticeWithRelations = Notice & {
  author: User & { avatarAsset: Asset | null };
  attachmentAsset: Asset | null;
};

type Requester = { id: string; role: Role };

function makePreview(body: string, len = 140): string {
  return body.length > len ? `${body.slice(0, len).trimEnd()}…` : body;
}

function publicNotice(notice: NoticeWithRelations, unread: boolean) {
  return {
    id: notice.id,
    title: notice.title,
    preview: notice.preview,
    body: notice.body,
    category: notice.category,
    pinned: notice.pinned,
    targetCourse: notice.targetCourse,
    targetSemester: notice.targetSemester,
    author: {
      id: notice.author.id,
      fullName: notice.author.fullName,
      avatarUrl: notice.author.avatarAsset?.secureUrl ?? null,
    },
    attachment: notice.attachmentAsset
      ? {
          name: notice.attachmentAsset.cloudinaryPublicId.split('/').pop() ?? 'attachment',
          url: notice.attachmentAsset.secureUrl,
          bytes: notice.attachmentAsset.bytes,
        }
      : null,
    createdAt: notice.createdAt,
    unread,
  };
}

/** Best-effort — never blocks the notice from being created. */
async function notifyStudentsOfNewNotice(notice: {
  id: string;
  title: string;
  category: NoticeCategory;
  targetCourse: string | null;
  targetSemester: number | null;
}) {
  try {
    const where: Record<string, unknown> = { role: 'Student', status: 'Active' };
    if (notice.targetCourse) where.course = notice.targetCourse;
    if (notice.targetSemester) where.semester = notice.targetSemester;

    const students = await prisma.user.findMany({ where, select: { id: true, expoPushToken: true } });
    if (students.length === 0) return;

    await prisma.notification.createMany({
      data: students.map((s) => ({
        userId: s.id,
        type: 'notice',
        title: `New ${notice.category} notice`,
        body: notice.title,
      })),
    });

    const pushTargets = students.filter(
      (s): s is typeof s & { expoPushToken: string } => !!s.expoPushToken
    );
    await sendExpoPushNotifications(
      pushTargets.map((s) => ({
        to: s.expoPushToken,
        title: `New ${notice.category} notice`,
        body: notice.title,
        data: { type: 'notice', noticeId: notice.id },
        sound: 'default',
      }))
    );
  } catch (err) {
    console.error('[notifications] failed to notify students of new notice (non-fatal):', (err as Error).message);
  }
}

export async function listNotices(requester: Requester, params: { category?: NoticeCategory; mine?: boolean }) {
  const where: Record<string, unknown> = {};
  if (params.category) where.category = params.category;

  if (params.mine) {
    where.authorId = requester.id;
  } else if (requester.role === 'Student') {
    const student = await prisma.user.findUnique({
      where: { id: requester.id },
      select: { course: true, semester: true },
    });
    where.AND = [
      { OR: [{ targetCourse: null }, { targetCourse: student?.course ?? null }] },
      { OR: [{ targetSemester: null }, { targetSemester: student?.semester ?? null }] },
    ];
  }

  const notices = await prisma.notice.findMany({
    where,
    include: { author: { include: { avatarAsset: true } }, attachmentAsset: true },
    orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
  });

  const reads = await prisma.noticeRead.findMany({
    where: { userId: requester.id, noticeId: { in: notices.map((n) => n.id) } },
    select: { noticeId: true },
  });
  const readSet = new Set(reads.map((r) => r.noticeId));

  return notices.map((n) => publicNotice(n, !readSet.has(n.id)));
}

export async function getNotice(requester: Requester, id: string) {
  const notice = await prisma.notice.findUnique({
    where: { id },
    include: { author: { include: { avatarAsset: true } }, attachmentAsset: true },
  });
  if (!notice) throw new ApiError(404, 'Notice not found');

  const read = await prisma.noticeRead.findUnique({
    where: { userId_noticeId: { userId: requester.id, noticeId: id } },
  });

  return publicNotice(notice, !read);
}

export async function markNoticeRead(userId: string, noticeId: string) {
  const notice = await prisma.notice.findUnique({ where: { id: noticeId } });
  if (!notice) throw new ApiError(404, 'Notice not found');

  await prisma.noticeRead.upsert({
    where: { userId_noticeId: { userId, noticeId } },
    create: { userId, noticeId },
    update: {},
  });
}

export async function createNotice(
  authorId: string,
  input: {
    title: string;
    body: string;
    category: NoticeCategory;
    pinned?: boolean;
    targetCourse?: string;
    targetSemester?: number;
    attachmentAssetId?: string;
  }
) {
  const notice = await prisma.notice.create({
    data: {
      title: input.title,
      body: input.body,
      preview: makePreview(input.body),
      category: input.category,
      pinned: input.pinned ?? false,
      targetCourse: input.targetCourse ?? null,
      targetSemester: input.targetSemester ?? null,
      attachmentAssetId: input.attachmentAssetId ?? null,
      authorId,
    },
    include: { author: { include: { avatarAsset: true } }, attachmentAsset: true },
  });

  await notifyStudentsOfNewNotice(notice);

  return publicNotice(notice, true);
}

export async function getNoticeAnalytics(noticeId: string) {
  const notice = await prisma.notice.findUnique({ where: { id: noticeId } });
  if (!notice) throw new ApiError(404, 'Notice not found');

  const audienceWhere: Record<string, unknown> = { role: 'Student', status: 'Active' };
  if (notice.targetCourse) audienceWhere.course = notice.targetCourse;
  if (notice.targetSemester) audienceWhere.semester = notice.targetSemester;

  const [totalAudience, readCount, unreadStudents] = await Promise.all([
    prisma.user.count({ where: audienceWhere }),
    prisma.noticeRead.count({ where: { noticeId } }),
    prisma.user.findMany({
      where: { ...audienceWhere, noticeReads: { none: { noticeId } } },
      select: { id: true, fullName: true, course: true, avatarAsset: { select: { secureUrl: true } } },
      take: 100,
    }),
  ]);

  return {
    noticeId,
    title: notice.title,
    totalAudience,
    readCount,
    unreadCount: Math.max(totalAudience - readCount, 0),
    readPct: totalAudience > 0 ? Math.round((readCount / totalAudience) * 100) : 0,
    unreadStudents: unreadStudents.map((u) => ({
      id: u.id,
      name: u.fullName,
      course: u.course,
      avatarUrl: u.avatarAsset?.secureUrl ?? null,
    })),
  };
}

export async function remindStudent(noticeId: string, studentId: string) {
  const notice = await prisma.notice.findUnique({ where: { id: noticeId } });
  if (!notice) throw new ApiError(404, 'Notice not found');

  const student = await prisma.user.findUnique({ where: { id: studentId } });
  if (!student) throw new ApiError(404, 'Student not found');

  await prisma.notification.create({
    data: {
      userId: studentId,
      type: 'notice_reminder',
      title: 'Reminder',
      body: `Please read: ${notice.title}`,
    },
  });

  // A "remind" is specifically for someone who hasn't opened the app to see this notice yet —
  // an in-app-only row does nothing for them until they open the app on their own. The actual
  // point of this action is the real push, same as a brand-new notice gets.
  if (student.expoPushToken) {
    await sendExpoPushNotifications([
      {
        to: student.expoPushToken,
        title: 'Reminder',
        body: `Please read: ${notice.title}`,
        data: { type: 'notice', noticeId: notice.id },
        sound: 'default',
      },
    ]);
  }
}
