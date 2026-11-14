import type { Role, UserStatus, User, Asset } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { sendMail } from '../../config/mailer';
import { ApiError } from '../../middleware/errorHandler';
import { revokeAllRefreshTokensForUser } from '../auth/auth.tokens';

function publicUser(user: User & { avatarAsset?: Asset | null }) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    status: user.status,
    course: user.course,
    semester: user.semester,
    department: user.department,
    avatarUrl: user.avatarAsset?.secureUrl ?? null,
    rejectedReason: user.rejectedReason,
    bannedReason: user.bannedReason,
    createdAt: user.createdAt,
    agreedToTermsAt: user.agreedToTermsAt,
  };
}

export async function listUsers(params: { search?: string; role?: Role; status?: UserStatus; activeToday?: boolean }) {
  const where: Record<string, unknown> = {};
  if (params.role) where.role = params.role;
  if (params.status) where.status = params.status;

  // Built as separate AND'd clauses (not both written to `where.OR`) so search and
  // activeToday can be combined later without one silently overwriting the other.
  const and: Record<string, unknown>[] = [];
  if (params.search) {
    and.push({
      OR: [
        { fullName: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
      ],
    });
  }
  if (params.activeToday) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    // Mirrors the dashboard's "active" proxy — no session/login log, so this is "did
    // something trackable today" (post, comment, message, like, notice read, quiz
    // attempt, or poll vote).
    and.push({
      OR: [
        { posts: { some: { createdAt: { gte: startOfToday } } } },
        { comments: { some: { createdAt: { gte: startOfToday } } } },
        { messages: { some: { createdAt: { gte: startOfToday } } } },
        { likes: { some: { createdAt: { gte: startOfToday } } } },
        { noticeReads: { some: { readAt: { gte: startOfToday } } } },
        { quizAttempts: { some: { startedAt: { gte: startOfToday } } } },
        { pollVotes: { some: { createdAt: { gte: startOfToday } } } },
      ],
    });
  }
  if (and.length > 0) where.AND = and;

  const users = await prisma.user.findMany({
    where,
    include: { avatarAsset: true },
    orderBy: { createdAt: 'desc' },
  });
  return users.map(publicUser);
}

async function getUserOrThrow(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { avatarAsset: true } });
  if (!user) throw new ApiError(404, 'User not found');
  return user;
}

/** A retried/duplicate request (or the wrong button tapped twice) must not silently flip a
 *  user through a status change that doesn't make sense from where they currently are — e.g.
 *  re-"approving" an already-banned user would otherwise undo the ban with no audit trail. */
function assertTransition(current: UserStatus, allowedFrom: UserStatus, action: string) {
  if (current !== allowedFrom) {
    throw new ApiError(409, `Can't ${action}: user is currently ${current}, not ${allowedFrom}`);
  }
}

export async function approveUser(userId: string) {
  const user = await getUserOrThrow(userId);
  assertTransition(user.status, 'PendingApproval', 'approve');

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { status: 'Active' },
    include: { avatarAsset: true },
  });

  try {
    await sendMail({ to: updated.email, template: 'account-approved', data: { fullName: updated.fullName } });
  } catch (err) {
    console.error('[mailer] approve email failed (non-fatal):', (err as Error).message);
  }

  return publicUser(updated);
}

export async function rejectUser(userId: string, reason: string) {
  const user = await getUserOrThrow(userId);
  assertTransition(user.status, 'PendingApproval', 'reject');

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { status: 'Rejected', rejectedReason: reason },
    include: { avatarAsset: true },
  });

  await revokeAllRefreshTokensForUser(userId);

  try {
    await sendMail({ to: updated.email, template: 'account-rejected', data: { fullName: updated.fullName, reason } });
  } catch (err) {
    console.error('[mailer] reject email failed (non-fatal):', (err as Error).message);
  }

  return publicUser(updated);
}

export async function banUser(userId: string, reason: string) {
  const user = await getUserOrThrow(userId);
  assertTransition(user.status, 'Active', 'ban');

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { status: 'Banned', bannedReason: reason },
    include: { avatarAsset: true },
  });

  await revokeAllRefreshTokensForUser(userId);

  try {
    await sendMail({ to: updated.email, template: 'account-banned', data: { fullName: updated.fullName, reason } });
  } catch (err) {
    console.error('[mailer] ban email failed (non-fatal):', (err as Error).message);
  }

  return publicUser(updated);
}

export async function unbanUser(userId: string) {
  const user = await getUserOrThrow(userId);
  assertTransition(user.status, 'Banned', 'unban');

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { status: 'Active', bannedReason: null },
    include: { avatarAsset: true },
  });
  return publicUser(updated);
}

export async function listAdminNotifications(adminId: string) {
  return prisma.notification.findMany({
    where: { userId: adminId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

// ---------------------------------------------------------------------------
// Dashboard stats — there's no session/login log, so "active" is proxied as
// "performed at least one tracked action" (post, comment, message, like,
// notice read, quiz attempt, or poll vote) on that day.
// ---------------------------------------------------------------------------

function localDayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export type DashboardFilters = {
  course?: string;
  semester?: number;
  dateRange?: 'Today' | 'This Week' | 'This Month' | 'This Semester';
};

/** The Date Range pill only scopes "created within window" stats (notices, quizzes, posts) —
 *  not the point-in-time counts (total/pending/banned) or the fixed 7-day activity chart,
 *  neither of which has a sensible "range" interpretation. */
function dateRangeStart(range?: DashboardFilters['dateRange']): Date | undefined {
  if (!range) return undefined;
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (range === 'Today') return d;
  if (range === 'This Week') d.setDate(d.getDate() - 6);
  else if (range === 'This Month') d.setDate(d.getDate() - 29);
  else d.setDate(d.getDate() - 179); // This Semester — rough half-year window
  return d;
}

async function getActiveUserCountsByDay(days: number, filters: DashboardFilters): Promise<number[]> {
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  let eligibleIds: string[] | undefined;
  if (filters.course || filters.semester) {
    const eligible = await prisma.user.findMany({
      where: {
        role: 'Student',
        ...(filters.course ? { course: filters.course } : {}),
        ...(filters.semester ? { semester: filters.semester } : {}),
      },
      select: { id: true },
    });
    eligibleIds = eligible.map((u) => u.id);
  }
  const userIn = eligibleIds ? { in: eligibleIds } : undefined;

  const [posts, comments, messages, likes, noticeReads, quizAttempts, pollVotes] = await Promise.all([
    prisma.post.findMany({
      where: { createdAt: { gte: start }, ...(userIn ? { authorId: userIn } : {}) },
      select: { authorId: true, createdAt: true },
    }),
    prisma.comment.findMany({
      where: { createdAt: { gte: start }, ...(userIn ? { authorId: userIn } : {}) },
      select: { authorId: true, createdAt: true },
    }),
    prisma.message.findMany({
      where: { createdAt: { gte: start }, ...(userIn ? { senderId: userIn } : {}) },
      select: { senderId: true, createdAt: true },
    }),
    prisma.like.findMany({
      where: { createdAt: { gte: start }, ...(userIn ? { userId: userIn } : {}) },
      select: { userId: true, createdAt: true },
    }),
    prisma.noticeRead.findMany({
      where: { readAt: { gte: start }, ...(userIn ? { userId: userIn } : {}) },
      select: { userId: true, readAt: true },
    }),
    prisma.quizAttempt.findMany({
      where: { startedAt: { gte: start }, ...(userIn ? { userId: userIn } : {}) },
      select: { userId: true, startedAt: true },
    }),
    prisma.pollVote.findMany({
      where: { createdAt: { gte: start }, ...(userIn ? { userId: userIn } : {}) },
      select: { userId: true, createdAt: true },
    }),
  ]);

  const buckets = new Map<string, Set<string>>();
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    buckets.set(localDayKey(d), new Set());
  }
  const add = (userId: string, at: Date) => buckets.get(localDayKey(at))?.add(userId);

  posts.forEach((p) => add(p.authorId, p.createdAt));
  comments.forEach((c) => add(c.authorId, c.createdAt));
  messages.forEach((m) => add(m.senderId, m.createdAt));
  likes.forEach((l) => add(l.userId, l.createdAt));
  noticeReads.forEach((n) => add(n.userId, n.readAt));
  quizAttempts.forEach((q) => add(q.userId, q.startedAt));
  pollVotes.forEach((p) => add(p.userId, p.createdAt));

  return [...buckets.values()].map((set) => set.size);
}

/** Read rate = NoticeRead rows / size of the notice's actual target audience (course+semester
 *  filtered, or every active student when untargeted). The dashboard's own course/semester
 *  filter further narrows which notices are included and narrows an untargeted notice's
 *  audience down to the selected cohort. */
async function getNoticeReadRates(limit: number, filters: DashboardFilters) {
  const and: Record<string, unknown>[] = [];
  const start = dateRangeStart(filters.dateRange);
  if (start) and.push({ createdAt: { gte: start } });
  if (filters.course) and.push({ OR: [{ targetCourse: filters.course }, { targetCourse: null }] });
  if (filters.semester) and.push({ OR: [{ targetSemester: filters.semester }, { targetSemester: null }] });

  const notices = await prisma.notice.findMany({
    where: and.length > 0 ? { AND: and } : {},
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: { title: true, targetCourse: true, targetSemester: true, _count: { select: { reads: true } } },
  });

  return Promise.all(
    notices.map(async (n) => {
      const audienceWhere: Record<string, unknown> = { role: 'Student', status: 'Active' };
      audienceWhere.course = n.targetCourse ?? filters.course ?? undefined;
      audienceWhere.semester = n.targetSemester ?? filters.semester ?? undefined;
      const audience = await prisma.user.count({ where: audienceWhere });
      const pct = audience > 0 ? Math.round((n._count.reads / audience) * 100) : 0;
      const label = n.title.length > 28 ? `${n.title.slice(0, 28)}…` : n.title;
      return { label, pct };
    })
  );
}

/** Overall attempted-vs-eligible rate across every quiz that has started (optionally narrowed
 *  to a course/semester/date-range), where "eligible" means active students in that quiz's
 *  own course + semester. */
async function getQuizParticipation(filters: DashboardFilters) {
  const start = dateRangeStart(filters.dateRange);
  const where: Record<string, unknown> = { startAt: { lte: new Date(), ...(start ? { gte: start } : {}) } };
  if (filters.course) where.course = filters.course;
  if (filters.semester) where.semester = filters.semester;

  const startedQuizzes = await prisma.quiz.findMany({ where, select: { id: true, course: true, semester: true } });
  if (startedQuizzes.length === 0) return { quizAttempted: 0, quizMissed: 0 };

  let totalEligible = 0;
  let totalAttempted = 0;
  for (const quiz of startedQuizzes) {
    const [eligible, attempted] = await Promise.all([
      prisma.user.count({ where: { role: 'Student', status: 'Active', course: quiz.course, semester: quiz.semester } }),
      prisma.quizAttempt.count({ where: { quizId: quiz.id } }),
    ]);
    totalEligible += eligible;
    totalAttempted += attempted;
  }

  if (totalEligible === 0) return { quizAttempted: 0, quizMissed: 0 };
  const quizAttempted = Math.round((totalAttempted / totalEligible) * 100);
  return { quizAttempted, quizMissed: 100 - quizAttempted };
}

async function getTopPosts(limit: number, filters: DashboardFilters) {
  const and: Record<string, unknown>[] = [{ status: 'Approved' }];
  const start = dateRangeStart(filters.dateRange);
  if (start) and.push({ createdAt: { gte: start } });
  if (filters.course || filters.semester) {
    and.push({
      author: {
        ...(filters.course ? { course: filters.course } : {}),
        ...(filters.semester ? { semester: filters.semester } : {}),
      },
    });
  }

  const posts = await prisma.post.findMany({
    where: { AND: and },
    include: {
      author: { select: { fullName: true, avatarAsset: { select: { secureUrl: true } } } },
      _count: { select: { likes: true, comments: true } },
    },
    orderBy: [{ likes: { _count: 'desc' } }, { comments: { _count: 'desc' } }],
    take: limit,
  });

  return posts.map((p) => ({
    id: p.id,
    author: p.author.fullName,
    avatarUrl: p.author.avatarAsset?.secureUrl ?? null,
    likes: p._count.likes,
    comments: p._count.comments,
  }));
}

export async function getDashboardStats(filters: DashboardFilters = {}) {
  const cohortWhere: Record<string, unknown> = {};
  if (filters.course) cohortWhere.course = filters.course;
  if (filters.semester) cohortWhere.semester = filters.semester;

  const [totalStudents, pendingApprovals, bannedUsers, activeUsersWeek, readRates, participation, topPosts] =
    await Promise.all([
      prisma.user.count({ where: { role: 'Student', status: 'Active', ...cohortWhere } }),
      prisma.user.count({ where: { status: 'PendingApproval', ...cohortWhere } }),
      prisma.user.count({ where: { status: 'Banned', ...cohortWhere } }),
      getActiveUserCountsByDay(7, filters),
      getNoticeReadRates(4, filters),
      getQuizParticipation(filters),
      getTopPosts(3, filters),
    ]);

  return {
    totalStudents,
    pendingApprovals,
    activeToday: activeUsersWeek[activeUsersWeek.length - 1],
    bannedUsers,
    activeUsersWeek,
    readRates,
    quizAttempted: participation.quizAttempted,
    quizMissed: participation.quizMissed,
    topPosts,
  };
}
