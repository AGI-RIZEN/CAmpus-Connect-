import { apiRequest } from './client';

export type PostStatus = 'Pending' | 'Approved' | 'Rejected';
export type ReportReason = 'Spam' | 'Inappropriate' | 'Harassment' | 'Other';
export type FeedScope = 'forYou' | 'popular' | 'myCourse';

export type Post = {
  id: string;
  caption: string;
  status: PostStatus;
  rejectedReason: string | null;
  author: { id: string; fullName: string; avatarUrl: string | null; course: string | null };
  images: { id: string; url: string }[];
  likesCount: number;
  commentsCount: number;
  liked: boolean;
  saved: boolean;
  createdAt: string;
};

export async function listFeed(scope: FeedScope = 'forYou'): Promise<Post[]> {
  return apiRequest(`/posts?scope=${scope}`, { auth: true });
}

export async function listMyPosts(): Promise<Post[]> {
  return apiRequest('/posts/mine', { auth: true });
}

export async function createPost(input: { caption: string; imageAssetIds: string[] }): Promise<Post> {
  return apiRequest('/posts', { method: 'POST', body: input, auth: true });
}

export async function toggleLike(postId: string): Promise<{ liked: boolean; likesCount: number }> {
  return apiRequest(`/posts/${postId}/like`, { method: 'POST', auth: true });
}

export async function toggleSave(postId: string): Promise<{ saved: boolean }> {
  return apiRequest(`/posts/${postId}/save`, { method: 'POST', auth: true });
}

export type Comment = {
  id: string;
  text: string;
  author: { id: string; fullName: string; avatarUrl: string | null };
  likesCount: number;
  liked: boolean;
  createdAt: string;
};

export async function listComments(postId: string): Promise<Comment[]> {
  return apiRequest(`/posts/${postId}/comments`, { auth: true });
}

export async function addComment(postId: string, text: string): Promise<Comment> {
  return apiRequest(`/posts/${postId}/comments`, { method: 'POST', body: { text }, auth: true });
}

export async function toggleCommentLike(commentId: string): Promise<{ liked: boolean; likesCount: number }> {
  return apiRequest(`/posts/comments/${commentId}/like`, { method: 'POST', auth: true });
}

export async function reportPost(postId: string, reason: ReportReason, details?: string): Promise<void> {
  await apiRequest(`/posts/${postId}/report`, { method: 'POST', body: { reason, details }, auth: true });
}

// --- Admin moderation ---

export type ModerationPost = {
  id: string;
  caption: string;
  status: PostStatus;
  rejectedReason: string | null;
  author: { id: string; fullName: string; avatarUrl: string | null; course: string | null };
  images: { id: string; url: string }[];
  likesCount: number;
  commentsCount: number;
  createdAt: string;
};

export async function listPendingPosts(): Promise<ModerationPost[]> {
  return apiRequest('/posts/admin/pending', { auth: true });
}

export async function approvePost(id: string): Promise<{ id: string; status: PostStatus }> {
  return apiRequest(`/posts/admin/${id}/approve`, { method: 'PATCH', auth: true });
}

export async function rejectPost(id: string, reason: string): Promise<{ id: string; status: PostStatus }> {
  return apiRequest(`/posts/admin/${id}/reject`, { method: 'PATCH', body: { reason }, auth: true });
}

export type ReportedPost = {
  postId: string;
  post: { id: string; caption: string; author: { id: string; fullName: string; avatarUrl: string | null }; image: string | null };
  reportedByCount: number;
  reasons: ReportReason[];
  latestReportAt: string;
  reports: { id: string; reason: ReportReason; details: string | null; reportedBy: { id: string; fullName: string }; createdAt: string }[];
};

export async function listOpenReports(): Promise<ReportedPost[]> {
  return apiRequest('/posts/admin/reports', { auth: true });
}

export async function dismissReports(postId: string): Promise<void> {
  await apiRequest(`/posts/admin/reports/${postId}/dismiss`, { method: 'PATCH', auth: true });
}

export async function actionReports(postId: string, reason: string): Promise<void> {
  await apiRequest(`/posts/admin/reports/${postId}/action`, { method: 'PATCH', body: { reason }, auth: true });
}
