import type { PagedResponse } from './quest';

export interface SocialPostDto {
  id: string;
  title: string;
  content: string;
  images: SocialPostImageDto[];
  tags: string[];
  quest: SocialPostQuestDto | null;
  authorDisplayName: string;
  createdAtUtc: string;
  updatedAtUtc: string;
  likeCount: number;
  commentCount: number;
  isLikedByViewer: boolean;
  canDelete: boolean;
  isHidden: boolean;
}

export interface SocialPostImageDto {
  imageUrl: string;
  imageAltText: string;
  sortOrder: number;
}

export interface SocialPostQuestDto {
  id: string;
  title: string;
  coverImageUrl: string | null;
  locationDescription: string | null;
  startAtUtc: string | null;
}

export interface SocialCommentReplyDto {
  id: string;
  postId: string;
  parentCommentId: string;
  content: string;
  authorDisplayName: string;
  createdAtUtc: string;
  canEdit: boolean;
}

export interface SocialCommentThreadDto {
  id: string;
  postId: string;
  content: string;
  authorDisplayName: string;
  createdAtUtc: string;
  canEdit: boolean;
  replies: SocialCommentReplyDto[];
  replyCount: number;
  hasMoreReplies: boolean;
}

export interface SocialLikeDto {
  likeCount: number;
  isLikedByViewer: boolean;
}

export interface CreateSocialPostInput {
  questId: string | null;
  title: string;
  content: string;
  images: Array<{
    imageUrl: string;
    imageAltText: string;
  }>;
  tags: string[];
  isHidden: boolean;
}

export interface UpdateSocialPostInput {
  postId: string;
  questId: string | null;
  title: string;
  content: string;
  images: CreateSocialPostInput['images'];
  tags: string[];
}

export interface CreateSocialCommentInput {
  postId: string;
  content: string;
  parentCommentId: string | null;
}

export interface UpdateSocialCommentInput {
  postId: string;
  commentId: string;
  content: string;
}

export type SocialPostPage = PagedResponse<SocialPostDto>;
export type SocialCommentPage = PagedResponse<SocialCommentThreadDto>;
