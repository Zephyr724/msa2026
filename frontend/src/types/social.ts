import type { PagedResponse } from './quest';

export interface SocialPostDto {
  id: string;
  content: string;
  imageUrl: string | null;
  imageAltText: string | null;
  authorDisplayName: string;
  createdAtUtc: string;
  updatedAtUtc: string;
  likeCount: number;
  commentCount: number;
  isLikedByViewer: boolean;
}

export interface SocialCommentReplyDto {
  id: string;
  postId: string;
  parentCommentId: string;
  content: string;
  authorDisplayName: string;
  createdAtUtc: string;
}

export interface SocialCommentThreadDto {
  id: string;
  postId: string;
  content: string;
  authorDisplayName: string;
  createdAtUtc: string;
  replies: SocialCommentReplyDto[];
  replyCount: number;
  hasMoreReplies: boolean;
}

export interface SocialLikeDto {
  likeCount: number;
  isLikedByViewer: boolean;
}

export interface CreateSocialPostInput {
  content: string;
  imageUrl: string | null;
  imageAltText: string | null;
}

export interface CreateSocialCommentInput {
  postId: string;
  content: string;
  parentCommentId: string | null;
}

export type SocialPostPage = PagedResponse<SocialPostDto>;
export type SocialCommentPage = PagedResponse<SocialCommentThreadDto>;
