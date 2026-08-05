import type {
  CreateSocialCommentInput,
  CreateSocialPostInput,
  SocialCommentPage,
  SocialLikeDto,
  SocialPostDto,
  SocialPostPage,
  UpdateSocialCommentInput,
} from '../../types/social';
import {
  validateSocialCommentPage,
  validateSocialLike,
  validateSocialPost,
  validateSocialPostPage,
} from '../validation/socialDto';
import { apiFetch } from './apiFetch';

export async function fetchSocialPosts(
  search: string,
  mine: boolean,
  page: number,
  pageSize = 12,
  signal?: AbortSignal,
): Promise<SocialPostPage> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (search) params.set('search', search);
  if (mine) params.set('mine', 'true');
  return validateSocialPostPage(
    await apiFetch<unknown>(`/v1/social/posts?${params.toString()}`, { signal }),
  );
}

export async function fetchSocialPost(
  postId: string,
  signal?: AbortSignal,
): Promise<SocialPostDto> {
  return validateSocialPost(await apiFetch<unknown>(
    `/v1/social/posts/${encodeURIComponent(postId)}`,
    { signal },
  ));
}

export async function createSocialPost(
  input: CreateSocialPostInput,
  signal?: AbortSignal,
): Promise<SocialPostDto> {
  return validateSocialPost(await apiFetch<unknown>('/v1/social/posts', {
    method: 'POST',
    body: JSON.stringify(input),
    signal,
  }));
}

export async function deleteSocialPost(
  postId: string,
  signal?: AbortSignal,
): Promise<void> {
  await apiFetch<unknown>(`/v1/social/posts/${encodeURIComponent(postId)}`, {
    method: 'DELETE',
    signal,
  });
}

export async function setSocialPostVisibility(
  postId: string,
  isHidden: boolean,
  signal?: AbortSignal,
): Promise<SocialPostDto> {
  return validateSocialPost(await apiFetch<unknown>(
    `/v1/social/posts/${encodeURIComponent(postId)}/visibility`,
    {
      method: 'PATCH',
      body: JSON.stringify({ isHidden }),
      signal,
    },
  ));
}

export async function setSocialPostLike(
  postId: string,
  isLiked: boolean,
  signal?: AbortSignal,
): Promise<SocialLikeDto> {
  return validateSocialLike(await apiFetch<unknown>(
    `/v1/social/posts/${encodeURIComponent(postId)}/like`,
    { method: isLiked ? 'PUT' : 'DELETE', signal },
  ));
}

export async function fetchSocialComments(
  postId: string,
  page: number,
  pageSize = 20,
  signal?: AbortSignal,
): Promise<SocialCommentPage> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  return validateSocialCommentPage(await apiFetch<unknown>(
    `/v1/social/posts/${encodeURIComponent(postId)}/comments?${params.toString()}`,
    { signal },
  ));
}

export async function createSocialComment(
  input: CreateSocialCommentInput,
  signal?: AbortSignal,
): Promise<void> {
  await apiFetch<unknown>(
    `/v1/social/posts/${encodeURIComponent(input.postId)}/comments`,
    {
      method: 'POST',
      body: JSON.stringify({
        content: input.content,
        parentCommentId: input.parentCommentId,
      }),
      signal,
    },
  );
}

export async function updateSocialComment(
  input: UpdateSocialCommentInput,
  signal?: AbortSignal,
): Promise<void> {
  await apiFetch<unknown>(
    `/v1/social/posts/${encodeURIComponent(input.postId)}/comments/${encodeURIComponent(input.commentId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ content: input.content }),
      signal,
    },
  );
}
