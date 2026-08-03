import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import {
  createSocialComment,
  createSocialPost,
  fetchSocialComments,
  fetchSocialPosts,
  setSocialPostLike,
} from '../lib/api/social';
import { ApiError } from '../lib/api/apiFetch';
import type {
  CreateSocialCommentInput,
  SocialPostPage,
} from '../types/social';

export const socialKeys = {
  all: ['social'] as const,
  feeds: ['social', 'posts'] as const,
  feed: (search: string) => ['social', 'posts', search] as const,
  comments: (postId: string) => ['social', 'comments', postId] as const,
};

export function useSocialFeed(search: string) {
  return useInfiniteQuery({
    queryKey: socialKeys.feed(search),
    queryFn: ({ pageParam }) => fetchSocialPosts(search, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage ? lastPage.page + 1 : undefined,
    staleTime: 30_000,
  });
}

export function useCreateSocialPost() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof createSocialPost>[0]) =>
      createSocialPost(input, client),
    onSuccess: () => client.invalidateQueries({ queryKey: socialKeys.feeds }),
  });
}

export function useSetSocialLike() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, isLiked }: { postId: string; isLiked: boolean }) =>
      setSocialPostLike(postId, isLiked, client),
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
      return { snapshots };
    },
    onError: (error, _variables, context) => {
      if (error instanceof ApiError && error.status === 401) return;
      for (const [key, data] of context?.snapshots ?? []) {
        client.setQueryData(key, data);
      }
    },
    onSettled: () => client.invalidateQueries({ queryKey: socialKeys.feeds }),
  });
}

export function useSocialComments(postId: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: socialKeys.comments(postId),
    queryFn: ({ pageParam }) => fetchSocialComments(postId, pageParam),
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
      createSocialComment({ ...input, postId }, client),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: socialKeys.comments(postId) }),
        client.invalidateQueries({ queryKey: socialKeys.feeds }),
      ]);
    },
  });
}
