import { Compass, MessageCircle, PenLine, Search, UserRound } from 'lucide-react';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import SocialPostCard from '../components/social/SocialPostCard';
import SocialPostComposer from '../components/social/SocialPostComposer';
import { useAuthQuery } from '../hooks/useAuth';
import { useSocialFeed } from '../hooks/useSocialFeed';
import type { SocialPostDto } from '../types/social.ts';

export default function CommunityPage() {
  const auth = useAuthQuery();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('q')?.trim() ?? '';
  const mineRequested = searchParams.get('view') === 'mine';
  const canWrite = Boolean(auth.data);
  const mine = mineRequested && canWrite;
  const [searchInput, setSearchInput] = useState(search);
  const [composerOpen, setComposerOpen] = useState(false);
  const [published, setPublished] = useState(false);
  const [publishedPost, setPublishedPost] = useState<SocialPostDto | null>(null);
  const verifiedCompletionId = searchParams.get('compose') === 'verified'
    ? searchParams.get('completionId')
    : null;
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const feed = useSocialFeed(search, mine);
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = feed;

  useEffect(() => setSearchInput(search), [search]);

  useEffect(() => {
    if (canWrite && verifiedCompletionId) setComposerOpen(true);
  }, [canWrite, verifiedCompletionId]);

  function closeComposer() {
    setComposerOpen(false);
    if (!verifiedCompletionId) return;
    const next = new URLSearchParams(searchParams);
    next.delete('compose');
    next.delete('completionId');
    setSearchParams(next, { replace: true });
  }

  function setView(nextMine: boolean) {
    const next = new URLSearchParams(searchParams);
    if (nextMine) next.set('view', 'mine');
    else next.delete('view');
    setSearchParams(next);
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = new URLSearchParams(searchParams);
    const value = searchInput.trim();
    if (value) next.set('q', value);
    else next.delete('q');
    setSearchParams(next);
  }

  function clearSearch() {
    const next = new URLSearchParams(searchParams);
    next.delete('q');
    setSearchParams(next);
  }

  const posts = feed.data?.pages.flatMap((page) => page.items) ?? [];
  const totalCount = feed.data?.pages[0]?.totalCount ?? 0;

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !hasNextPage || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting) && !isFetchingNextPage) {
        void fetchNextPage();
      }
    }, { rootMargin: '320px' });
    observer.observe(target);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-base-100 pb-28">
      <header className="border-b border-base-300/70 bg-base-100">
        <div className="kiwi-page-wide py-4 sm:py-9">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="kiwi-eyebrow hidden sm:inline-flex">
                <MessageCircle aria-hidden="true" className="size-4" />
                Community stories
              </p>
              <h1 className="text-2xl sm:mt-2 sm:text-4xl">Discover local action</h1>
              <p className="mt-2 hidden max-w-xl text-sm leading-relaxed text-muted-content sm:block sm:text-base">
                Browse what people are doing, open a story for the full post, and join the conversation there.
              </p>
            </div>
            <form className="flex w-full max-w-xl gap-2" onSubmit={handleSearch} role="search">
              <label className="sr-only" htmlFor="community-search">Search community posts</label>
              <div className="relative min-w-0 flex-1">
                <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-content" />
                <input
                  className="input input-bordered h-11 w-full rounded-full bg-base-100 pl-10"
                  id="community-search"
                  maxLength={100}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search posts, tags or people"
                  type="search"
                  value={searchInput}
                />
              </div>
              <button className="btn btn-primary h-11 rounded-full px-5" type="submit">Search</button>
            </form>
          </div>

          <nav aria-label="Community feed views" className="mt-6 flex items-center gap-2 border-b border-base-300">
            <button
              aria-current={!mineRequested ? 'page' : undefined}
              className={`inline-flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-extrabold ${!mineRequested ? 'border-primary text-primary' : 'border-transparent text-muted-content hover:text-base-content'}`}
              onClick={() => setView(false)}
              type="button"
            >
              <Compass aria-hidden="true" className="size-4" />
              Explore
            </button>
            {canWrite && (
              <button
                aria-current={mineRequested ? 'page' : undefined}
                className={`inline-flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-extrabold ${mineRequested ? 'border-primary text-primary' : 'border-transparent text-muted-content hover:text-base-content'}`}
                onClick={() => setView(true)}
                type="button"
              >
                <UserRound aria-hidden="true" className="size-4" />
                My posts
              </button>
            )}
          </nav>

          {search && (
            <div className="mt-3 flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-content">{totalCount} {totalCount === 1 ? 'post' : 'posts'} matching “{search}”</span>
              <button className="link link-primary font-bold" onClick={clearSearch} type="button">Clear</button>
            </div>
          )}
        </div>
      </header>

      <div className="kiwi-page-wide py-7">
        {published && (
          <div className="alert alert-success mb-6 rounded-2xl" role="status">
            <span>{publishedPost?.isVerifiedQuestStory ? 'Your Verified Quest Story is now part of your public impact record.' : 'Your post is now in the community feed.'}</span>
            {publishedPost && <Link className="btn btn-ghost btn-sm" to={`/community/posts/${publishedPost.id}`}>View story →</Link>}
          </div>
        )}

        {mineRequested && !auth.isPending && !canWrite ? (
          <section className="kiwi-panel mx-auto max-w-lg p-8 text-center">
            <UserRound aria-hidden="true" className="mx-auto size-10 text-primary" />
            <h2 className="mt-4 text-2xl">Sign in to see your posts</h2>
            <p className="mt-2 text-muted-content">Your public and hidden posts will appear together here.</p>
            <Link className="btn btn-primary mt-5 rounded-full px-6" to="/login">Sign in</Link>
          </section>
        ) : (
          <section aria-busy={feed.isPending} aria-label={mine ? 'My community posts' : 'Community post feed'}>
            {feed.isPending && (
              <div aria-label="Loading community posts" className="columns-2 gap-3 sm:columns-3 sm:gap-4 lg:columns-4 xl:columns-5">
                {[16, 12, 18, 14, 17, 13, 19, 15, 12, 17].map((height, index) => (
                  <div className="mb-4 inline-block w-full break-inside-avoid overflow-hidden rounded-2xl bg-base-100 ring-1 ring-base-300" key={index}>
                    <div className="skeleton w-full" style={{ height: `${height}rem` }} />
                    <div className="space-y-2 p-3"><div className="skeleton h-4 w-5/6" /><div className="skeleton h-3 w-1/2" /></div>
                  </div>
                ))}
              </div>
            )}

            {feed.isError && (
              <section className="kiwi-panel p-8 text-center" role="alert">
                <MessageCircle aria-hidden="true" className="mx-auto size-10 text-error" />
                <h2 className="mt-4 text-2xl">The community feed is unavailable.</h2>
                <p className="mt-2 text-muted-content">Check your connection and try again.</p>
                <button className="btn btn-primary mt-5 rounded-full" onClick={() => void feed.refetch()} type="button">Retry</button>
              </section>
            )}

            {feed.isSuccess && posts.length === 0 && (
              <section className="kiwi-panel p-8 text-center">
                <Search aria-hidden="true" className="mx-auto size-10 text-primary" />
                <h2 className="mt-4 text-2xl">
                  {search ? 'No posts match this search.' : mine ? 'You have not published a post yet.' : 'No community posts yet.'}
                </h2>
                <p className="mt-2 text-muted-content">
                  {search ? 'Try a broader phrase or clear the search.' : mine ? 'Use New post when you are ready to share.' : 'Be the first to share a local action.'}
                </p>
                {search && <button className="btn btn-primary mt-5 rounded-full" onClick={clearSearch} type="button">Clear search</button>}
              </section>
            )}

            {posts.length > 0 && (
              <div className="columns-2 gap-3 sm:columns-3 sm:gap-4 lg:columns-4 xl:columns-5">
                {posts.map((post) => <SocialPostCard canLike={canWrite} key={post.id} post={post} />)}
              </div>
            )}

            {feed.hasNextPage && (
              <div className="mt-3 flex justify-center" ref={loadMoreRef}>
                <button className="btn btn-outline rounded-full px-8" disabled={feed.isFetchingNextPage} onClick={() => void feed.fetchNextPage()} type="button">
                  {feed.isFetchingNextPage ? 'Loading more…' : 'Load more stories'}
                </button>
              </div>
            )}
          </section>
        )}
      </div>

      {!auth.isPending && (canWrite ? (
        <button
          aria-label="New post"
          className="btn btn-primary fixed bottom-24 right-4 z-30 h-14 rounded-full px-5 shadow-[0_12px_35px_rgba(32,97,67,0.35)] md:bottom-8 md:right-8"
          onClick={() => { setPublished(false); setComposerOpen(true); }}
          type="button"
        >
          <PenLine aria-hidden="true" className="size-5" />
          New post
        </button>
      ) : (
        <Link
          aria-label="Sign in to create a post"
          className="btn btn-primary fixed bottom-24 right-4 z-30 h-14 rounded-full px-5 shadow-[0_12px_35px_rgba(32,97,67,0.35)] md:bottom-8 md:right-8"
          to="/login"
        >
          <PenLine aria-hidden="true" className="size-5" />
          New post
        </Link>
      ))}

      <SocialPostComposer
        onClose={closeComposer}
        onPublished={(post) => { setPublished(true); setPublishedPost(post); }}
        open={composerOpen}
        verifiedCompletionId={verifiedCompletionId}
      />
    </div>
  );
}
