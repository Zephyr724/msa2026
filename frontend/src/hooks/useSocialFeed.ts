import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import {
  createSocialComment,
  createSocialPost,
  deleteSocialPost,
  fetchSocialComments,
  fetchSocialPost,
  fetchSocialPosts,
  setSocialPostLike,
  setSocialPostVisibility,
  updateSocialComment,
  updateSocialPost,
} from '../lib/api/social';
import { ApiError } from '../lib/api/apiFetch';
import { executePrivateQuery, executePrivateRequest } from '../lib/api/privateCache.ts';
import type {
  CreateSocialCommentInput,
  SocialPostDto,
  SocialPostPage,
} from '../types/social';

export const socialKeys = {
  all: ['social'] as const,
  feeds: ['social', 'posts'] as const,
  feed: (search: string, mine: boolean) => ['social', 'posts', { search, mine }] as const,
  detail: (postId: string) => ['social', 'post', postId] as const,
  comments: (postId: string) => ['social', 'comments', postId] as const,
};

export function useSocialFeed(search: string, mine: boolean) {
  return useInfiniteQuery({
    queryKey: socialKeys.feed(search, mine),
    queryFn: ({ client, pageParam, signal }) => executePrivateQuery(
      client, socialKeys.feed(search, mine), signal,
      (signal) => fetchSocialPosts(search, mine, pageParam, 12, signal),
    ),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage ? lastPage.page + 1 : undefined,
    staleTime: 30_000,
  });
}

export function useSocialPost(postId: string) {
  return useQuery({
    queryKey: socialKeys.detail(postId),
    queryFn: ({ client, signal }) => executePrivateQuery(
      client,
      socialKeys.detail(postId),
      signal,
      (signal) => fetchSocialPost(postId, signal),
    ),
    enabled: Boolean(postId),
  });
}

export function useCreateSocialPost() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof createSocialPost>[0]) =>
      executePrivateRequest(client, (signal) => createSocialPost(input, signal)),
    onSuccess: () => client.invalidateQueries({ queryKey: socialKeys.feeds }),
  });
}

export function useUpdateSocialPost() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof updateSocialPost>[0]) =>
      executePrivateRequest(client, (signal) => updateSocialPost(input, signal)),
    onSuccess: async (post) => {
      client.setQueryData(socialKeys.detail(post.id), post);
      await client.invalidateQueries({ queryKey: socialKeys.feeds });
    },
  });
}

export function useDeleteSocialPost() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => executePrivateRequest(
      client,
      (signal) => deleteSocialPost(postId, signal),
    ),
    onSuccess: async (_result, postId) => {
      client.removeQueries({ queryKey: socialKeys.comments(postId) });
      client.removeQueries({ queryKey: socialKeys.detail(postId) });
      await client.invalidateQueries({ queryKey: socialKeys.feeds });
    },
  });
}

export function useSetSocialPostVisibility() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, isHidden }: { postId: string; isHidden: boolean }) =>
      executePrivateRequest(
        client,
        (signal) => setSocialPostVisibility(postId, isHidden, signal),
      ),
    onSuccess: async (post) => {
      client.setQueryData(socialKeys.detail(post.id), post);
      await client.invalidateQueries({ queryKey: socialKeys.feeds });
    },
  });
}

export function useSetSocialLike() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, isLiked }: { postId: string; isLiked: boolean }) =>
      executePrivateRequest(
        client,
        (signal) => setSocialPostLike(postId, isLiked, signal),
      ),
    onMutate: async ({ postId, isLiked }) => {
      await client.cancelQueries({ queryKey: socialKeys.feeds });
      const snapshots = client.getQueriesData<InfiniteData<SocialPostPage>>({
        queryKey: socialKeys.feeds,
      });
      client.setQueriesData<InfiniteData<SocialPostPage>>(
        { queryKey: socialKeys.feeds },
        (data) => data && ({
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            items: page.items.map((post) => post.id === postId ? {
              ...post,
              isLikedByViewer: isLiked,
              likeCount: Math.max(0, post.likeCount + (isLiked ? 1 : -1)),
            } : post),
          })),
        }),
      );
      const detailSnapshot = client.getQueryData<SocialPostDto>(socialKeys.detail(postId));
      if (detailSnapshot) {
        client.setQueryData<SocialPostDto>(socialKeys.detail(postId), {
          ...detailSnapshot,
          isLikedByViewer: isLiked,
          likeCount: Math.max(0, detailSnapshot.likeCount + (isLiked ? 1 : -1)),
        });
      }
      return { snapshots, detailSnapshot };
    },
    onError: (error, { postId }, context) => {
      if (error instanceof ApiError && error.status === 401) return;
      for (const [key, data] of context?.snapshots ?? []) {
        client.setQueryData(key, data);
      }
      if (context?.detailSnapshot) {
        client.setQueryData(socialKeys.detail(postId), context.detailSnapshot);
      }
    },
    onSuccess: (result, { postId }) => {
      client.setQueriesData<InfiniteData<SocialPostPage>>(
        { queryKey: socialKeys.feeds },
        (data) => data && ({
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            items: page.items.map((post) => post.id === postId ? {
              ...post,
              likeCount: result.likeCount,
              isLikedByViewer: result.isLikedByViewer,
            } : post),
          })),
        }),
      );
      client.setQueryData<SocialPostDto>(socialKeys.detail(postId), (post) => post && ({
        ...post,
        likeCount: result.likeCount,
        isLikedByViewer: result.isLikedByViewer,
      }));
    },
    onSettled: () => client.invalidateQueries({ queryKey: socialKeys.feeds }),
  });
}

export function useSocialComments(postId: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: socialKeys.comments(postId),
    queryFn: ({ client, pageParam, signal }) => executePrivateQuery(
      client, socialKeys.comments(postId), signal,
      (signal) => fetchSocialComments(postId, pageParam, 20, signal),
    ),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage ? lastPage.page + 1 : undefined,
    enabled,
  });
}

export function useCreateSocialComment(postId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<CreateSocialCommentInput, 'postId'>) =>
      executePrivateRequest(
        client,
        (signal) => createSocialComment({ ...input, postId }, signal),
      ),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: socialKeys.comments(postId) }),
        client.invalidateQueries({ queryKey: socialKeys.feeds }),
      ]);
    },
  });
}

export function useUpdateSocialComment(postId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) =>
      executePrivateRequest(
        client,
        (signal) => updateSocialComment({ postId, commentId, content }, signal),
      ),
    onSuccess: () => client.invalidateQueries({ queryKey: socialKeys.comments(postId) }),
  });
}
