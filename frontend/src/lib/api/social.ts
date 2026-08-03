import type { QueryClient } from '@tanstack/react-query';
import type {
  CreateSocialCommentInput,
  CreateSocialPostInput,
  SocialCommentPage,
  SocialLikeDto,
  SocialPostDto,
  SocialPostPage,
} from '../../types/social';
import {
  validateSocialCommentPage,
  validateSocialLike,
  validateSocialPost,
  validateSocialPostPage,
} from '../validation/socialDto';
import { ApiError, apiFetch } from './apiFetch';
import { expirePrivateSession } from './privateCache';

export async function fetchSocialPosts(
  search: string,
  page: number,
  pageSize = 12,
): Promise<SocialPostPage> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (search) params.set('search', search);
  return validateSocialPostPage(
    await apiFetch<unknown>(`/v1/social/posts?${params.toString()}`),
  );
}

export async function createSocialPost(
  input: CreateSocialPostInput,
  queryClient: QueryClient,
): Promise<SocialPostDto> {
  return withPrivateSessionExpiry(queryClient, async () =>
    validateSocialPost(await apiFetch<unknown>('/v1/social/posts', {
      method: 'POST',
      body: JSON.stringify(input),
    })));
}

export async function setSocialPostLike(
  postId: string,
  isLiked: boolean,
  queryClient: QueryClient,
): Promise<SocialLikeDto> {
  return withPrivateSessionExpiry(queryClient, async () =>
    validateSocialLike(await apiFetch<unknown>(
      `/v1/social/posts/${encodeURIComponent(postId)}/like`,
      { method: isLiked ? 'PUT' : 'DELETE' },
    )));
}

export async function fetchSocialComments(
  postId: string,
  page: number,
  pageSize = 20,
): Promise<SocialCommentPage> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  return validateSocialCommentPage(await apiFetch<unknown>(
    `/v1/social/posts/${encodeURIComponent(postId)}/comments?${params.toString()}`,
  ));
}

export async function createSocialComment(
  input: CreateSocialCommentInput,
  queryClient: QueryClient,
): Promise<void> {
  await withPrivateSessionExpiry(queryClient, () => apiFetch<unknown>(
    `/v1/social/posts/${encodeURIComponent(input.postId)}/comments`,
    {
      method: 'POST',
      body: JSON.stringify({
        content: input.content,
        parentCommentId: input.parentCommentId,
      }),
    },
  ));
}

async function withPrivateSessionExpiry<T>(
  queryClient: QueryClient,
  operation: () => Promise<T>,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      await expirePrivateSession(queryClient);
    }
    throw error;
  }
}
