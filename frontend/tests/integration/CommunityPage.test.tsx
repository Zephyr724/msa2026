import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  createMemoryRouter,
  RouterProvider,
} from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetCsrfToken } from '../../src/lib/api/apiFetch';
import CommunityPage from '../../src/pages/CommunityPage';
import type {
  SocialCommentThreadDto,
  SocialPostDto,
} from '../../src/types/social';
import { createTestQueryClient, jsonResponse } from '../organizerTestUtils';

const session = {
  userId: '11111111-1111-4111-8111-111111111111',
  displayName: 'Aroha',
  email: 'aroha@example.test',
  roles: ['Member'],
};

function socialPost(overrides: Partial<SocialPostDto> = {}): SocialPostDto {
  return {
    id: '22222222-2222-4222-8222-222222222222',
    content: 'Planted native trees beside the stream.',
    imageUrl: null,
    imageAltText: null,
    authorDisplayName: 'Mereana',
    createdAtUtc: '2026-07-31T09:00:00.000Z',
    updatedAtUtc: '2026-07-31T09:00:00.000Z',
    likeCount: 1,
    commentCount: 2,
    isLikedByViewer: false,
    ...overrides,
  };
}

function postPage(items: SocialPostDto[]) {
  return {
    items,
    page: 1,
    pageSize: 12,
    totalCount: items.length,
    totalPages: items.length ? 1 : 0,
    hasNextPage: false,
    hasPreviousPage: false,
  };
}

function commentPage(items: SocialCommentThreadDto[]) {
  return {
    items,
    page: 1,
    pageSize: 20,
    totalCount: items.length,
    totalPages: items.length ? 1 : 0,
    hasNextPage: false,
    hasPreviousPage: false,
  };
}

function renderPage(initialEntry = '/community') {
  const router = createMemoryRouter([
    { path: '/community', element: <CommunityPage /> },
    { path: '/login', element: <p>Sign-in destination</p> },
  ], { initialEntries: [initialEntry] });
  const queryClient = createTestQueryClient();
  const view = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { ...view, queryClient };
}

describe('CommunityPage', () => {
  afterEach(() => {
    resetCsrfToken();
    vi.unstubAllGlobals();
  });

  it('renders a bounded feed loading state', () => {
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) => {
      if (String(input).endsWith('/v1/auth/me')) {
        return Promise.resolve(new Response(null, { status: 401 }));
      }
      return new Promise<Response>(() => {});
    }));

    renderPage();

    expect(screen.getByLabelText('Loading community posts')).toBeInTheDocument();
  });

  it('owns search in the URL and renders an honest empty state', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/v1/auth/me')) {
        return Promise.resolve(new Response(null, { status: 401 }));
      }
      if (url.includes('/v1/social/posts')) {
        return Promise.resolve(jsonResponse(postPage([])));
      }
      return Promise.resolve(jsonResponse({}, 500));
    });
    vi.stubGlobal('fetch', fetchMock);

    renderPage('/community?q=native%20trees');

    expect(await screen.findByRole('heading', {
      name: 'No posts match this search.',
    })).toBeInTheDocument();
    const socialCall = fetchMock.mock.calls.find(([input]) =>
      String(input).includes('/v1/social/posts'));
    expect(socialCall).toBeDefined();
    expect(new URL(String(socialCall![0]), 'https://example.test').searchParams.get('search'))
      .toBe('native trees');
    expect(screen.getByDisplayValue('native trees')).toBeInTheDocument();
  });

  it('lets guests browse while keeping every write action behind sign-in', async () => {
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/v1/auth/me')) {
        return Promise.resolve(new Response(null, { status: 401 }));
      }
      if (url.includes('/v1/social/posts')) {
        return Promise.resolve(jsonResponse(postPage([socialPost()])));
      }
      return Promise.resolve(jsonResponse({}, 500));
    }));

    renderPage();

    expect(await screen.findByText('Planted native trees beside the stream.'))
      .toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign in to like/i })).toHaveAttribute(
      'href',
      '/login',
    );
    expect(screen.queryByRole('heading', { name: 'Publish a post' })).not.toBeInTheDocument();
  });

  it('publishes a validated post and refreshes the feed', async () => {
    const user = userEvent.setup();
    let posts: SocialPostDto[] = [];
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/v1/auth/me')) return Promise.resolve(jsonResponse(session));
      if (url.endsWith('/v1/auth/csrf-token')) {
        return Promise.resolve(jsonResponse({ token: 'social-token' }));
      }
      if (url.endsWith('/v1/social/posts') && init?.method === 'POST') {
        const body = JSON.parse(String(init.body)) as { content: string };
        posts = [socialPost({ content: body.content, authorDisplayName: 'Aroha' })];
        return Promise.resolve(jsonResponse(posts[0], 201));
      }
      if (url.includes('/v1/social/posts')) {
        return Promise.resolve(jsonResponse(postPage(posts)));
      }
      return Promise.resolve(jsonResponse({}, 500));
    });
    vi.stubGlobal('fetch', fetchMock);
    renderPage();

    await user.type(await screen.findByLabelText('What happened?'), 'Cleaned the local stream bank.');
    await user.click(screen.getByRole('button', { name: 'Publish' }));

    expect(await screen.findByRole('status')).toHaveTextContent('now in the community feed');
    expect(await screen.findByText('Cleaned the local stream bank.')).toBeInTheDocument();
    const publishCall = fetchMock.mock.calls.find(([input, init]) =>
      String(input).endsWith('/v1/social/posts') && init?.method === 'POST');
    expect(JSON.parse(String(publishCall?.[1]?.body))).toEqual({
      content: 'Cleaned the local stream bank.',
      imageUrl: null,
      imageAltText: null,
    });
  });

  it('updates likes immediately and reconciles with the server', async () => {
    const user = userEvent.setup();
    let post = socialPost();
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/v1/auth/me')) return Promise.resolve(jsonResponse(session));
      if (url.endsWith('/v1/auth/csrf-token')) {
        return Promise.resolve(jsonResponse({ token: 'like-token' }));
      }
      if (url.endsWith(`/v1/social/posts/${post.id}/like`) && init?.method === 'PUT') {
        post = { ...post, likeCount: 2, isLikedByViewer: true };
        return Promise.resolve(jsonResponse({ likeCount: 2, isLikedByViewer: true }));
      }
      if (url.includes('/v1/social/posts')) {
        return Promise.resolve(jsonResponse(postPage([post])));
      }
      return Promise.resolve(jsonResponse({}, 500));
    }));
    renderPage();

    const like = await screen.findByRole('button', { name: 'Like post' });
    await user.click(like);

    await waitFor(() => expect(screen.getByRole('button', { name: 'Unlike post' }))
      .toHaveTextContent('2'));
  });

  it('renders two-level comments and submits roots and direct replies', async () => {
    const user = userEvent.setup();
    const post = socialPost();
    const rootId = '33333333-3333-4333-8333-333333333333';
    const thread: SocialCommentThreadDto = {
      id: rootId,
      postId: post.id,
      content: 'This is a great place to start.',
      authorDisplayName: 'Wiremu',
      createdAtUtc: '2026-07-31T09:05:00.000Z',
      replyCount: 1,
      hasMoreReplies: false,
      replies: [{
        id: '44444444-4444-4444-8444-444444444444',
        postId: post.id,
        parentCommentId: rootId,
        content: 'I can bring reusable gloves.',
        authorDisplayName: 'Hana',
        createdAtUtc: '2026-07-31T09:06:00.000Z',
      }],
    };
    const submittedBodies: unknown[] = [];
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/v1/auth/me')) return Promise.resolve(jsonResponse(session));
      if (url.endsWith('/v1/auth/csrf-token')) {
        return Promise.resolve(jsonResponse({ token: 'comment-token' }));
      }
      if (url.endsWith(`/v1/social/posts/${post.id}/comments`) && init?.method === 'POST') {
        submittedBodies.push(JSON.parse(String(init.body)));
        return Promise.resolve(jsonResponse({}, 201));
      }
      if (url.includes(`/v1/social/posts/${post.id}/comments`)) {
        return Promise.resolve(jsonResponse(commentPage([thread])));
      }
      if (url.includes('/v1/social/posts')) {
        return Promise.resolve(jsonResponse(postPage([post])));
      }
      return Promise.resolve(jsonResponse({}, 500));
    }));
    renderPage();

    await user.click(await screen.findByRole('button', { name: '2 comments' }));
    expect(await screen.findByText('This is a great place to start.')).toBeInTheDocument();
    expect(screen.getByText('I can bring reusable gloves.')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Reply' })).toHaveLength(1);

    await user.type(screen.getByLabelText('Add a comment'), 'Count me in.');
    await user.click(screen.getByRole('button', { name: 'Send comment' }));
    await waitFor(() => expect(submittedBodies).toHaveLength(1));

    await user.click(screen.getByRole('button', { name: 'Reply' }));
    await user.type(screen.getByLabelText('Write a reply'), 'Thanks, see you there.');
    await user.click(screen.getByRole('button', { name: 'Send reply' }));
    await waitFor(() => expect(submittedBodies).toHaveLength(2));
    expect(submittedBodies).toEqual([
      { content: 'Count me in.', parentCommentId: null },
      { content: 'Thanks, see you there.', parentCommentId: rootId },
    ]);
  });

  it('expires the private session without restoring social cache after a write 401', async () => {
    const user = userEvent.setup();
    const post = socialPost();
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/v1/auth/me')) return Promise.resolve(jsonResponse(session));
      if (url.endsWith('/v1/auth/csrf-token')) {
        return Promise.resolve(jsonResponse({ token: 'expired-token' }));
      }
      if (url.endsWith(`/v1/social/posts/${post.id}/like`) && init?.method === 'PUT') {
        return Promise.resolve(jsonResponse({}, 401));
      }
      if (url.includes('/v1/social/posts')) {
        return Promise.resolve(jsonResponse(postPage([post])));
      }
      return Promise.resolve(jsonResponse({}, 500));
    }));
    const { queryClient } = renderPage();

    await user.click(await screen.findByRole('button', { name: 'Like post' }));

    await waitFor(() => expect(queryClient.getQueryData(['auth', 'me'])).toBeNull());
    expect(await screen.findByRole('link', { name: /sign in to like/i }))
      .toHaveAttribute('href', '/login');
  });
});
