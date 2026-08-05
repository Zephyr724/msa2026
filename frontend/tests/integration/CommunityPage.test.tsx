import { QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
    title: 'A streamside planting story',
    content: 'Planted native trees beside the stream.',
    images: [],
    tags: ['StreamCare'],
    quest: {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      title: 'Community Stream Cleanup',
      coverImageUrl: '/images/quests/stream-cleanup.svg',
      locationDescription: 'Oakley Creek',
      startAtUtc: '2099-08-01T09:00:00.000Z',
    },
    authorDisplayName: 'Mereana',
    createdAtUtc: '2026-07-31T09:00:00.000Z',
    updatedAtUtc: '2026-07-31T09:00:00.000Z',
    likeCount: 1,
    commentCount: 2,
    isLikedByViewer: false,
    canDelete: false,
    isHidden: false,
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

const questPage = {
  items: [{
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    title: 'Community Stream Cleanup',
    description: 'Restore a local stream.',
    category: 'CleanReduceWaste',
    sourceType: 'OrganizerOwned',
    registrationMode: 'Native',
    difficulty: 'Easy',
    xpAward: 50,
    capacity: 30,
    availableSpots: 12,
    startAtUtc: '2099-08-01T09:00:00.000Z',
    endAtUtc: null,
    locationRegion: null,
    locationDescription: 'Oakley Creek',
    coverImage: {
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      imageUrl: '/images/quests/stream-cleanup.svg',
      altText: 'Volunteers cleaning a stream',
    },
    latitude: null,
    longitude: null,
  }],
  page: 1,
  pageSize: 20,
  totalCount: 1,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

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
    expect(screen.getByRole('link', { name: /sign in to create a post/i })).toHaveAttribute(
      'href',
      '/login',
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('lets an author retry the required Quest picker', async () => {
    const user = userEvent.setup();
    let questAttempts = 0;
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/v1/auth/me')) return Promise.resolve(jsonResponse(session));
      if (url.includes('/v1/quests')) {
        questAttempts += 1;
        return Promise.resolve(questAttempts === 1
          ? jsonResponse({}, 503)
          : jsonResponse(questPage));
      }
      if (url.includes('/v1/social/posts')) {
        return Promise.resolve(jsonResponse(postPage([])));
      }
      return Promise.resolve(jsonResponse({}, 500));
    }));
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'New post' }));
    expect(await screen.findByText('Quests could not be loaded.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByRole('button', { name: /Community Stream Cleanup/ }))
      .toBeInTheDocument();
    expect(questAttempts).toBe(2);
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
      if (url.includes('/v1/quests')) {
        return Promise.resolve(jsonResponse(questPage));
      }
      if (url.endsWith('/v1/social/posts') && init?.method === 'POST') {
        const body = JSON.parse(String(init.body)) as {
          title: string;
          content: string;
          images: SocialPostDto['images'];
          tags: string[];
          isHidden: boolean;
        };
        posts = [socialPost({
          title: body.title,
          content: body.content,
          images: body.images.map((image, sortOrder) => ({ ...image, sortOrder })),
          tags: body.tags,
          authorDisplayName: 'Aroha',
          canDelete: true,
          isHidden: body.isHidden,
        })];
        return Promise.resolve(jsonResponse(posts[0], 201));
      }
      if (url.includes('/v1/social/posts')) {
        return Promise.resolve(jsonResponse(postPage(posts)));
      }
      return Promise.resolve(jsonResponse({}, 500));
    });
    vi.stubGlobal('fetch', fetchMock);
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'New post' }));
    expect(await screen.findByRole('dialog', { name: 'Create a new post' })).toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: /Community Stream Cleanup/ }));
    await user.type(screen.getByLabelText(/^Title/), 'A cleaner stream in one afternoon');
    await user.click(screen.getByRole('button', { name: 'Add image' }));
    await user.type(screen.getByLabelText('Image 1 URL'), 'https://images.example.test/stream-one.jpg');
    await user.type(screen.getByLabelText('Image 1 description'), 'Volunteers collecting rubbish');
    await user.click(screen.getByRole('button', { name: 'Add image' }));
    await user.type(screen.getByLabelText('Image 2 URL'), 'https://images.example.test/stream-two.jpg');
    await user.type(screen.getByLabelText('Image 2 description'), 'The restored stream bank');
    await user.type(screen.getByLabelText(/^Body/), 'Cleaned the local stream bank.');
    const tagInput = screen.getByLabelText('Add a tag');
    await user.type(tagInput, 'StreamCare');
    await user.click(screen.getByRole('button', { name: 'Add' }));
    await user.type(tagInput, 'streamcare');
    await user.click(screen.getByRole('button', { name: 'Add' }));
    expect(screen.getByRole('alert')).toHaveTextContent('That tag is already added.');
    expect(tagInput).toHaveValue('streamcare');
    await user.clear(tagInput);
    await user.click(screen.getByRole('button', { name: /Only me/ }));
    await user.click(screen.getByRole('button', { name: 'Publish post' }));

    expect(await screen.findByRole('status')).toHaveTextContent('now in the community feed');
    expect(await screen.findByText('A cleaner stream in one afternoon')).toBeInTheDocument();
    expect(screen.getByText('Cleaned the local stream bank.')).toBeInTheDocument();
    expect(screen.getAllByText('#StreamCare').length).toBeGreaterThan(0);
    const publishCall = fetchMock.mock.calls.find(([input, init]) =>
      String(input).endsWith('/v1/social/posts') && init?.method === 'POST');
    expect(JSON.parse(String(publishCall?.[1]?.body))).toEqual({
      questId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      title: 'A cleaner stream in one afternoon',
      content: 'Cleaned the local stream bank.',
      images: [
        {
          imageUrl: 'https://images.example.test/stream-one.jpg',
          imageAltText: 'Volunteers collecting rubbish',
        },
        {
          imageUrl: 'https://images.example.test/stream-two.jpg',
          imageAltText: 'The restored stream bank',
        },
      ],
      tags: ['StreamCare'],
      isHidden: true,
    });
  });

  it('updates likes immediately and reconciles with the server', async () => {
    const user = userEvent.setup();
    const post = socialPost();
    let likeWasSaved = false;
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/v1/auth/me')) return Promise.resolve(jsonResponse(session));
      if (url.endsWith('/v1/auth/csrf-token')) {
        return Promise.resolve(jsonResponse({ token: 'like-token' }));
      }
      if (url.endsWith(`/v1/social/posts/${post.id}/like`) && init?.method === 'PUT') {
        likeWasSaved = true;
        return Promise.resolve(jsonResponse({ likeCount: 7, isLikedByViewer: true }));
      }
      if (url.includes('/v1/social/posts')) {
        if (likeWasSaved) return Promise.resolve(jsonResponse({}, 500));
        return Promise.resolve(jsonResponse(postPage([post])));
      }
      return Promise.resolve(jsonResponse({}, 500));
    }));
    renderPage();

    const like = await screen.findByRole('button', { name: 'Like post' });
    await user.click(like);

    await waitFor(() => expect(screen.getByRole('button', { name: 'Unlike post' }))
      .toHaveTextContent('7'));
  });

  it('lets readers scroll or click through every image in a post', async () => {
    const user = userEvent.setup();
    const longTitle = 'x'.repeat(120);
    const post = socialPost({
      title: longTitle,
      images: [
        {
          imageUrl: 'https://images.example.test/one.jpg',
          imageAltText: 'Volunteers at the start of the Quest',
          sortOrder: 0,
        },
        {
          imageUrl: 'https://images.example.test/two.jpg',
          imageAltText: 'The restored stream after the Quest',
          sortOrder: 1,
        },
      ],
    });
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/v1/auth/me')) return Promise.resolve(new Response(null, { status: 401 }));
      if (url.includes('/v1/social/posts')) return Promise.resolve(jsonResponse(postPage([post])));
      return Promise.resolve(jsonResponse({}, 500));
    }));
    renderPage();

    expect(await screen.findByText('1 / 2')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: longTitle })).toHaveClass('break-words');
    expect(screen.getByAltText('Volunteers at the start of the Quest')).toBeInTheDocument();
    expect(screen.getByAltText('The restored stream after the Quest')).toBeInTheDocument();
    const slides = screen.getByRole('group', { name: 'Image slides' });
    expect(slides).toHaveAttribute('tabindex', '0');
    expect(screen.getByText('1 / 2')).toHaveAttribute('aria-live', 'polite');

    Object.defineProperty(slides, 'clientWidth', { configurable: true, value: 300 });
    Object.defineProperty(slides, 'scrollLeft', { configurable: true, value: 300, writable: true });
    fireEvent.scroll(slides);
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Previous image' }));
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next image' }));
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
  });

  it('lets the author hide, restore, and permanently delete a post', async () => {
    const user = userEvent.setup();
    let posts = [socialPost({ canDelete: true })];
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/v1/auth/me')) return Promise.resolve(jsonResponse(session));
      if (url.endsWith('/v1/auth/csrf-token')) {
        return Promise.resolve(jsonResponse({ token: 'manage-post-token' }));
      }
      if (url.endsWith(`/v1/social/posts/${posts[0]?.id}/visibility`) && init?.method === 'PATCH') {
        const body = JSON.parse(String(init.body)) as { isHidden: boolean };
        posts = [{ ...posts[0], isHidden: body.isHidden }];
        return Promise.resolve(jsonResponse(posts[0]));
      }
      if (url.endsWith(`/v1/social/posts/${posts[0]?.id}`) && init?.method === 'DELETE') {
        posts = [];
        return Promise.resolve(new Response(null, { status: 204 }));
      }
      if (url.includes('/v1/social/posts')) return Promise.resolve(jsonResponse(postPage(posts)));
      return Promise.resolve(jsonResponse({}, 500));
    });
    vi.stubGlobal('fetch', fetchMock);
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Hide post' }));
    expect(await screen.findByText('Only you')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Make post public' }));
    await waitFor(() => expect(screen.queryByText('Only you')).not.toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Delete post' }));
    expect(screen.getByRole('dialog', { name: 'Delete this post?' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Delete permanently' }));
    expect(await screen.findByRole('heading', { name: 'No community posts yet.' }))
      .toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([input, init]) =>
      String(input).endsWith('/visibility') && init?.method === 'PATCH')).toBe(true);
    expect(fetchMock.mock.calls.some(([input, init]) =>
      String(input).includes('/v1/social/posts/') && init?.method === 'DELETE')).toBe(true);
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
