import { QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetCsrfToken } from '../../src/lib/api/apiFetch';
import CommunityPage from '../../src/pages/CommunityPage';
import SocialPostDetailPage from '../../src/pages/SocialPostDetailPage';
import type { SocialCommentThreadDto, SocialPostDto } from '../../src/types/social';
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
    images: [{
      imageUrl: 'https://images.example.test/stream.jpg',
      imageAltText: 'Native planting beside a stream',
      sortOrder: 0,
    }],
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
    likeCount: 7,
    commentCount: 2,
    isLikedByViewer: false,
    canDelete: false,
    isHidden: false,
    isVerifiedQuestStory: false,
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
    { path: '/community/posts/:postId', element: <SocialPostDetailPage /> },
    { path: '/quests/:questId', element: <p>Quest destination</p> },
    { path: '/login', element: <p>Sign-in destination</p> },
  ], { initialEntries: [initialEntry] });
  const queryClient = createTestQueryClient();
  const view = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { ...view, queryClient, router };
}

describe('Community post discovery and detail', () => {
  afterEach(() => {
    vi.useRealTimers();
    resetCsrfToken();
    vi.unstubAllGlobals();
  });

  it('renders a compact image-first card and opens the complete post from anywhere', async () => {
    const user = userEvent.setup();
    const post = socialPost();
    const squareCoverPost = socialPost({
      id: '55555555-5555-4555-8555-555555555555',
      title: 'A square cover',
      images: [{
        imageUrl: 'https://images.example.test/square.jpg',
        imageAltText: 'Square cover example',
        sortOrder: 0,
      }],
    });
    const tallCoverPost = socialPost({
      id: '44444444-4444-4444-8444-444444444444',
      title: 'A bounded tall cover',
      images: [{
        imageUrl: 'https://images.example.test/tall.jpg',
        imageAltText: 'Extra-tall cover example',
        sortOrder: 0,
      }],
    });
    const textCoverPost = socialPost({
      id: '33333333-3333-4333-8333-333333333333',
      title: 'A post without photos',
      content: 'The first complete sentence becomes the cover. This sentence stays inside detail.',
      images: [],
      quest: null,
    });
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/v1/auth/me')) return Promise.resolve(new Response(null, { status: 401 }));
      if (url.includes(`/v1/social/posts/${post.id}/comments`)) return Promise.resolve(jsonResponse(commentPage([])));
      if (url.endsWith(`/v1/social/posts/${post.id}`)) return Promise.resolve(jsonResponse(post));
      if (url.includes('/v1/social/posts')) return Promise.resolve(jsonResponse(postPage([post, squareCoverPost, tallCoverPost, textCoverPost])));
      return Promise.resolve(jsonResponse({}, 500));
    }));

    renderPage();

    const card = await screen.findByRole('link', { name: `Open post: ${post.title}` });
    expect(card).toHaveTextContent(post.title);
    expect(card).toHaveTextContent(post.authorDisplayName);
    expect(card).toHaveTextContent(`Quest · ${post.quest?.title}`);
    const wideImage = card.querySelector('img');
    expect(wideImage).not.toBeNull();
    Object.defineProperties(wideImage!, {
      naturalWidth: { configurable: true, value: 1600 },
      naturalHeight: { configurable: true, value: 900 },
    });
    fireEvent.load(wideImage!);
    expect(wideImage).toHaveClass('aspect-[4/3]', 'object-cover');
    expect(screen.getAllByRole('link', { name: 'Sign in to like post' })).toHaveLength(4);
    const squareImage = screen.getByAltText('Square cover example');
    Object.defineProperties(squareImage, {
      naturalWidth: { configurable: true, value: 900 },
      naturalHeight: { configurable: true, value: 900 },
    });
    fireEvent.load(squareImage);
    expect(squareImage).toHaveClass('h-auto');
    expect(squareImage).not.toHaveClass('object-cover');
    const tallImage = screen.getByAltText('Extra-tall cover example');
    Object.defineProperties(tallImage, {
      naturalWidth: { configurable: true, value: 600 },
      naturalHeight: { configurable: true, value: 1200 },
    });
    fireEvent.load(tallImage);
    expect(tallImage).toHaveClass('aspect-[19/25]', 'object-cover');
    const textCoverCard = screen.getByRole('link', { name: `Open post: ${textCoverPost.title}` });
    expect(textCoverCard.querySelector('[data-testid="social-text-cover"]')).toHaveClass(
      'aspect-[19/25]',
      'bg-secondary',
    );
    expect(textCoverCard.querySelector('[data-testid="social-text-cover-watermark"]')).toHaveStyle({
      backgroundImage: "url('/branding/kiwimpact-leaf-watermark.svg')",
    });
    expect(textCoverCard.querySelector('[data-testid="social-text-cover-quote"]')).toBeInTheDocument();
    expect(textCoverCard).toHaveTextContent('The first complete sentence becomes the cover.');
    expect(textCoverCard).not.toHaveTextContent('This sentence stays inside detail.');
    expect(screen.getByTestId('community-masonry')).toHaveClass(
      'grid-cols-2',
      'sm:grid-cols-3',
      'lg:grid-cols-4',
      'xl:grid-cols-5',
    );
    expect(screen.queryByText(post.content)).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '2 comments' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign in to create a post' })).toHaveClass('fixed', 'right-4');

    await user.click(card);

    expect(await screen.findByText(post.content)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Community Stream Cleanup/ })).toHaveAttribute('href', `/quests/${post.quest?.id}`);
    expect(await screen.findByRole('heading', { name: '2 comments' })).toBeInTheDocument();
  });

  it('reuses the secondary patterned text cover in no-image post detail', async () => {
    const textCoverPost = socialPost({
      title: 'A post without photos',
      content: 'The first complete sentence becomes the cover. The rest remains in detail.',
      images: [],
      quest: null,
      commentCount: 0,
    });
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/v1/auth/me')) return Promise.resolve(new Response(null, { status: 401 }));
      if (url.includes(`/v1/social/posts/${textCoverPost.id}/comments`)) return Promise.resolve(jsonResponse(commentPage([])));
      if (url.endsWith(`/v1/social/posts/${textCoverPost.id}`)) return Promise.resolve(jsonResponse(textCoverPost));
      return Promise.resolve(jsonResponse({}, 500));
    }));

    renderPage(`/community/posts/${textCoverPost.id}`);

    const detailCover = await screen.findByTestId('social-text-cover');
    expect(detailCover).toHaveClass('aspect-[19/25]', 'bg-secondary', 'md:h-full', 'md:aspect-auto');
    expect(screen.getByTestId('social-text-cover-watermark')).toBeInTheDocument();
    expect(detailCover).toHaveTextContent('The first complete sentence becomes the cover.');
  });

  it('likes from the card without opening it while every other card area opens the post', async () => {
    const user = userEvent.setup();
    let post = socialPost();
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/v1/auth/me')) return Promise.resolve(jsonResponse(session));
      if (url.endsWith('/v1/auth/csrf-token')) return Promise.resolve(jsonResponse({ token: 'card-like-token' }));
      if (url.endsWith(`/v1/social/posts/${post.id}/like`) && init?.method === 'PUT') {
        post = { ...post, isLikedByViewer: true, likeCount: 8 };
        return Promise.resolve(jsonResponse({ likeCount: 8, isLikedByViewer: true }));
      }
      if (url.includes(`/v1/social/posts/${post.id}/comments`)) return Promise.resolve(jsonResponse(commentPage([])));
      if (url.endsWith(`/v1/social/posts/${post.id}`)) return Promise.resolve(jsonResponse(post));
      if (url.includes('/v1/social/posts')) return Promise.resolve(jsonResponse(postPage([post])));
      return Promise.resolve(jsonResponse({}, 500));
    });
    vi.stubGlobal('fetch', fetchMock);
    const { router } = renderPage();

    await user.click(await screen.findByRole('button', { name: 'Like post' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(`/v1/social/posts/${post.id}/like`),
      expect.objectContaining({ method: 'PUT' }),
    ));
    expect(router.state.location.pathname).toBe('/community');
    expect(await screen.findByRole('button', { name: 'Unlike post' })).toHaveTextContent('8');

    await user.click(screen.getByRole('link', { name: `Open post: ${post.title}` }));
    expect(router.state.location.pathname).toBe(`/community/posts/${post.id}`);
    expect(await screen.findByText(post.content)).toBeInTheDocument();
  });

  it('keeps search in the URL and supports a signed-in My posts view', async () => {
    const user = userEvent.setup();
    const post = socialPost({ authorDisplayName: 'Aroha', canDelete: true, isHidden: true });
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/v1/auth/me')) return Promise.resolve(jsonResponse(session));
      if (url.includes('/v1/social/posts')) return Promise.resolve(jsonResponse(postPage([post])));
      return Promise.resolve(jsonResponse({}, 500));
    });
    vi.stubGlobal('fetch', fetchMock);
    const { router } = renderPage('/community?q=stream');

    await user.click(await screen.findByRole('button', { name: 'My posts' }));

    await waitFor(() => expect(router.state.location.search).toContain('view=mine'));
    const mineCall = fetchMock.mock.calls.find(([input]) => {
      const url = new URL(String(input), 'https://example.test');
      return url.pathname.endsWith('/v1/social/posts') && url.searchParams.get('mine') === 'true';
    });
    expect(mineCall).toBeDefined();
    expect(new URL(String(mineCall![0]), 'https://example.test').searchParams.get('search')).toBe('stream');
    expect(await screen.findByText('Only you')).toBeInTheDocument();
  });

  it('opens the floating New post action and publishes multiple images with an optional Quest', async () => {
    const user = userEvent.setup();
    let submitted: Record<string, unknown> | null = null;
    let posts: SocialPostDto[] = [];
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/v1/auth/me')) return Promise.resolve(jsonResponse(session));
      if (url.endsWith('/v1/auth/csrf-token')) return Promise.resolve(jsonResponse({ token: 'publish-token' }));
      if (url.includes('/v1/quests')) return Promise.resolve(jsonResponse(questPage));
      if (url.endsWith('/v1/social/posts') && init?.method === 'POST') {
        submitted = JSON.parse(String(init.body)) as Record<string, unknown>;
        posts = [socialPost({
          title: String(submitted.title),
          content: String(submitted.content),
          images: (submitted.images as SocialPostDto['images']).map((image, sortOrder) => ({ ...image, sortOrder })),
          quest: null,
          authorDisplayName: 'Aroha',
          canDelete: true,
        })];
        return Promise.resolve(jsonResponse(posts[0], 201));
      }
      if (url.includes('/v1/social/posts')) return Promise.resolve(jsonResponse(postPage(posts)));
      return Promise.resolve(jsonResponse({}, 500));
    });
    vi.stubGlobal('fetch', fetchMock);
    renderPage();

    const newPost = await screen.findByRole('button', { name: 'New post' });
    expect(newPost).toHaveClass('fixed', 'right-4');
    await user.click(newPost);
    expect(await screen.findByRole('dialog', { name: 'Create a new post' })).toBeInTheDocument();
    await user.type(screen.getByLabelText(/^Title/), 'A cleaner stream in one afternoon');
    await user.type(screen.getByLabelText(/^Body/), 'Cleaned the local stream bank.');
    await user.click(screen.getByRole('button', { name: 'Add image' }));
    await user.type(screen.getByLabelText('Image 1 URL'), 'https://images.example.test/one.jpg');
    await user.type(screen.getByLabelText('Image 1 description'), 'Before the cleanup');
    await user.click(screen.getByRole('button', { name: 'Add image' }));
    await user.type(screen.getByLabelText('Image 2 URL'), 'https://images.example.test/two.jpg');
    await user.type(screen.getByLabelText('Image 2 description'), 'After the cleanup');
    await user.click(screen.getByRole('button', { name: 'Publish post' }));

    await waitFor(() => expect(submitted).not.toBeNull());
    expect(submitted).toMatchObject({
      questId: null,
      title: 'A cleaner stream in one afternoon',
      content: 'Cleaned the local stream bank.',
    });
    expect(submitted?.images).toHaveLength(2);
    expect(await screen.findByText('A cleaner stream in one afternoon')).toBeInTheDocument();
    expect(screen.queryByText('Cleaned the local stream bank.')).not.toBeInTheDocument();
  });

  it('shows the carousel and comments only in detail, and lets the author edit a comment', async () => {
    const user = userEvent.setup();
    const rootId = '33333333-3333-4333-8333-333333333333';
    const post = socialPost({
      images: [
        { imageUrl: 'https://images.example.test/one.jpg', imageAltText: 'First community view', sortOrder: 0 },
        { imageUrl: 'https://images.example.test/two.jpg', imageAltText: 'Second community view', sortOrder: 1 },
      ],
    });
    let rootContent = 'This is a great place to start.';
    let editBody: unknown;
    let replyBody: unknown;
    const replies: SocialCommentThreadDto['replies'] = [{
      id: '44444444-4444-4444-8444-444444444444',
      postId: post.id,
      parentCommentId: rootId,
      content: 'I can bring reusable gloves.',
      authorDisplayName: 'Hana',
      createdAtUtc: '2026-07-31T09:06:00.000Z',
      canEdit: false,
    }];
    const thread = (): SocialCommentThreadDto => ({
      id: rootId,
      postId: post.id,
      content: rootContent,
      authorDisplayName: 'Aroha',
      createdAtUtc: '2026-07-31T09:05:00.000Z',
      canEdit: true,
      replyCount: replies.length,
      hasMoreReplies: false,
      replies,
    });
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/v1/auth/me')) return Promise.resolve(jsonResponse(session));
      if (url.endsWith('/v1/auth/csrf-token')) return Promise.resolve(jsonResponse({ token: 'edit-token' }));
      if (url.endsWith(`/comments/${rootId}`) && init?.method === 'PATCH') {
        editBody = JSON.parse(String(init.body));
        rootContent = (editBody as { content: string }).content;
        return Promise.resolve(jsonResponse({}, 200));
      }
      if (url.endsWith(`/v1/social/posts/${post.id}/comments`) && init?.method === 'POST') {
        replyBody = JSON.parse(String(init.body));
        replies.push({
          id: '55555555-5555-4555-8555-555555555555',
          postId: post.id,
          parentCommentId: rootId,
          content: (replyBody as { content: string }).content,
          authorDisplayName: 'Aroha',
          createdAtUtc: '2026-07-31T09:07:00.000Z',
          canEdit: true,
        });
        return Promise.resolve(jsonResponse({}, 201));
      }
      if (url.includes(`/v1/social/posts/${post.id}/comments`)) return Promise.resolve(jsonResponse(commentPage([thread()])));
      if (url.endsWith(`/v1/social/posts/${post.id}`)) return Promise.resolve(jsonResponse(post));
      return Promise.resolve(jsonResponse({}, 500));
    }));
    renderPage(`/community/posts/${post.id}`);

    expect(await screen.findByText('1 / 2')).toBeInTheDocument();
    const slides = screen.getByRole('group', { name: 'Image slides' });
    Object.defineProperty(slides, 'clientWidth', { configurable: true, value: 300 });
    Object.defineProperty(slides, 'scrollLeft', { configurable: true, value: 300, writable: true });
    fireEvent.scroll(slides);
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Previous image' }));
    expect(screen.getByText('1 / 2')).toBeInTheDocument();

    expect(await screen.findByText(rootContent)).toBeInTheDocument();
    expect(screen.getByText('I can bring reusable gloves.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Edit reply by Hana/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reply to Hana' }));
    await user.type(screen.getByLabelText('Write a reply to Hana'), 'Replying to the second-level comment.');
    await user.click(screen.getByRole('button', { name: 'Send reply' }));
    await waitFor(() => expect(replyBody).toEqual({
      content: 'Replying to the second-level comment.',
      parentCommentId: replies[0]?.id,
    }));
    expect(await screen.findByText('Replying to the second-level comment.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Edit comment by Aroha' }));
    const editor = screen.getByLabelText('Edit comment');
    await user.clear(editor);
    await user.type(editor, 'Updated with a useful detail.');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(editBody).toEqual({ content: 'Updated with a useful detail.' }));
    expect(await screen.findByText('Updated with a useful detail.')).toBeInTheDocument();
  });

  it('keeps likes and author visibility/delete management inside the opened post', async () => {
    const user = userEvent.setup();
    let post = socialPost({ authorDisplayName: 'Aroha', canDelete: true });
    let deleted = false;
    let likeAttempts = 0;
    let editBody: Record<string, unknown> | null = null;
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/v1/auth/me')) return Promise.resolve(jsonResponse(session));
      if (url.endsWith('/v1/auth/csrf-token')) return Promise.resolve(jsonResponse({ token: 'manage-token' }));
      if (url.endsWith(`/v1/social/posts/${post.id}/visibility`) && init?.method === 'PATCH') {
        post = { ...post, isHidden: true };
        return Promise.resolve(jsonResponse(post));
      }
      if (url.endsWith(`/v1/social/posts/${post.id}`) && init?.method === 'PATCH') {
        editBody = JSON.parse(String(init.body)) as Record<string, unknown>;
        post = {
          ...post,
          title: String(editBody.title),
          content: String(editBody.content),
          images: (editBody.images as SocialPostDto['images']).map((image, sortOrder) => ({
            ...image,
            sortOrder,
          })),
          tags: editBody.tags as string[],
          quest: editBody.questId ? post.quest : null,
        };
        return Promise.resolve(jsonResponse(post));
      }
      if (url.endsWith(`/v1/social/posts/${post.id}/like`) && init?.method === 'PUT') {
        likeAttempts += 1;
        return Promise.resolve(likeAttempts === 1
          ? jsonResponse({}, 429)
          : jsonResponse({ likeCount: 8, isLikedByViewer: true }));
      }
      if (url.endsWith(`/v1/social/posts/${post.id}`) && init?.method === 'DELETE') {
        deleted = true;
        return Promise.resolve(new Response(null, { status: 204 }));
      }
      if (url.includes(`/v1/social/posts/${post.id}/comments`)) return Promise.resolve(jsonResponse(commentPage([])));
      if (url.includes('/v1/quests')) return Promise.resolve(jsonResponse(questPage));
      if (url.endsWith(`/v1/social/posts/${post.id}`)) return Promise.resolve(jsonResponse(post));
      if (url.includes('/v1/social/posts')) return Promise.resolve(jsonResponse(postPage([])));
      return Promise.resolve(jsonResponse({}, 500));
    }));
    renderPage(`/community/posts/${post.id}`);

    await user.click((await screen.findAllByRole('button', { name: 'Edit post' }))[0]);
    const editDialog = await screen.findByRole('dialog', { name: 'Edit post' });
    expect(editDialog).toHaveTextContent('Current related Quest');
    expect(editDialog).toHaveTextContent('Community Stream Cleanup');
    const title = screen.getByLabelText(/^Title/);
    vi.useFakeTimers();
    fireEvent.change(title, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    const floatingError = screen.getByRole('alert');
    expect(floatingError).toHaveTextContent('Add a title for your post.');
    expect(floatingError).toHaveClass('alert-error', 'inset-x-0', 'bottom-full', 'rounded-2xl');
    expect(screen.getByTestId('post-composer-actions')).toContainElement(floatingError);
    act(() => vi.advanceTimersByTime(8_000));
    expect(screen.queryByText('Add a title for your post.')).not.toBeInTheDocument();
    vi.useRealTimers();
    await user.type(title, 'Edited stream story');
    const body = screen.getByLabelText(/^Body/);
    await user.clear(body);
    await user.type(body, 'Edited details from the stream.');
    await user.click(screen.getByRole('button', { name: 'Remove related Quest' }));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(editBody).toMatchObject({
      questId: null,
      title: 'Edited stream story',
      content: 'Edited details from the stream.',
      tags: ['StreamCare'],
    }));
    expect(await screen.findByRole('heading', { name: 'Edited stream story' })).toBeInTheDocument();
    expect(screen.getByText('Edited details from the stream.')).toBeInTheDocument();

    await user.click(await screen.findByRole('button', { name: 'Like post' }));
    const likeError = await screen.findByText('Please wait before reacting again.');
    expect(likeError).not.toHaveClass('sr-only');
    await user.click(screen.getByRole('button', { name: 'Like post' }));
    expect(await screen.findByRole('button', { name: 'Unlike post' })).toHaveTextContent('8');
    await user.click(screen.getAllByRole('button', { name: 'Hide post' })[0]);
    expect((await screen.findAllByText('Only you')).length).toBeGreaterThan(0);
    await user.click(screen.getAllByRole('button', { name: 'Delete post' })[0]);
    await user.click(screen.getByRole('button', { name: 'Delete permanently' }));
    await waitFor(() => expect(deleted).toBe(true));
    expect(await screen.findByRole('heading', { name: /You have not published/ })).toBeInTheDocument();
  });

  it('keeps search empty states honest', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/v1/auth/me')) return Promise.resolve(new Response(null, { status: 401 }));
      if (url.includes('/v1/social/posts')) return Promise.resolve(jsonResponse(postPage([])));
      return Promise.resolve(jsonResponse({}, 500));
    });
    vi.stubGlobal('fetch', fetchMock);
    renderPage('/community?q=native%20trees');

    expect(await screen.findByRole('heading', { name: 'No posts match this search.' })).toBeInTheDocument();
    const socialCall = fetchMock.mock.calls.find(([input]) => String(input).includes('/v1/social/posts'));
    expect(new URL(String(socialCall?.[0]), 'https://example.test').searchParams.get('search')).toBe('native trees');
  });

  it('locks a Verified Quest Story to the owned completion and publishes provenance', async () => {
    const user = userEvent.setup();
    const completionId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
    const verifiedPost = socialPost({
      authorDisplayName: 'Aroha',
      canDelete: true,
      isVerifiedQuestStory: true,
      title: 'My verified impact: Community Stream Cleanup',
      content: 'I completed Community Stream Cleanup. Here is what I did and the impact it made:',
    });
    let submitted: Record<string, unknown> | null = null;
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/v1/auth/me')) return Promise.resolve(jsonResponse(session));
      if (url.endsWith('/v1/auth/csrf-token')) return Promise.resolve(jsonResponse({ token: 'verified-story-token' }));
      if (url.endsWith(`/v1/users/me/verified-completions/${completionId}/story-context`)) {
        return Promise.resolve(jsonResponse({
          completionId,
          questId: questPage.items[0].id,
          questTitle: questPage.items[0].title,
        }));
      }
      if (url.endsWith('/v1/social/posts') && init?.method === 'POST') {
        submitted = JSON.parse(String(init.body));
        return Promise.resolve(jsonResponse(verifiedPost, 201));
      }
      if (url.includes('/v1/social/posts')) return Promise.resolve(jsonResponse(postPage([])));
      return Promise.resolve(jsonResponse({}, 500));
    });
    vi.stubGlobal('fetch', fetchMock);

    renderPage(`/community?compose=verified&completionId=${completionId}`);

    const dialog = await screen.findByRole('dialog', { name: 'Create a new post' });
    expect(await within(dialog).findByText('Verified Quest Story')).toBeInTheDocument();
    expect(within(dialog).getByText('The Quest is locked to the verified completion. You can edit the story itself.')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Search published Quests')).toBeDisabled();
    await waitFor(() => expect(within(dialog).getByLabelText(/^Title/)).toHaveValue(
      'My verified impact: Community Stream Cleanup',
    ));

    await user.click(within(dialog).getByRole('button', { name: 'Publish post' }));

    await waitFor(() => expect(submitted).toMatchObject({
      questId: questPage.items[0].id,
      sourceCompletionId: completionId,
      isHidden: false,
    }));
    expect(await screen.findByText('Your Verified Quest Story is now part of your public impact record.')).toBeInTheDocument();
  });
});
