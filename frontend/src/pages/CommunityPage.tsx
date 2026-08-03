import { MessageCircle, Search, Sparkles, Users } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import SocialPostCard from '../components/social/SocialPostCard';
import SocialPostComposer from '../components/social/SocialPostComposer';
import { useAuthQuery } from '../hooks/useAuth';
import { useSocialFeed } from '../hooks/useSocialFeed';

export default function CommunityPage() {
  const auth = useAuthQuery();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('q')?.trim() ?? '';
  const [searchInput, setSearchInput] = useState(search);
  const feed = useSocialFeed(search);

  useEffect(() => setSearchInput(search), [search]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = searchInput.trim();
    setSearchParams(next ? { q: next } : {});
  }

  const posts = feed.data?.pages.flatMap((page) => page.items) ?? [];
  const totalCount = feed.data?.pages[0]?.totalCount ?? 0;
  const canWrite = Boolean(auth.data);

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <section className="kiwi-topography border-b border-base-300 bg-base-100">
        <div className="kiwi-page-wide grid gap-8 py-10 lg:grid-cols-[1fr_0.75fr] lg:items-center lg:py-14">
          <div>
            <p className="kiwi-eyebrow">
              <Users aria-hidden="true" className="size-4" />
              Community stories
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl leading-tight sm:text-5xl">
              Small local actions deserve to be seen.
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-content">
              Share progress, find practical ideas, and encourage people taking
              care of places across Aotearoa.
            </p>
          </div>
          <div className="kiwi-panel p-5 sm:p-6">
            <form className="flex gap-2" onSubmit={handleSearch} role="search">
              <label className="sr-only" htmlFor="community-search">Search community posts</label>
              <div className="relative min-w-0 flex-1">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-content"
                />
                <input
                  className="input input-bordered h-12 w-full rounded-full pl-10"
                  id="community-search"
                  maxLength={100}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search stories or people…"
                  type="search"
                  value={searchInput}
                />
              </div>
              <button className="btn btn-primary h-12 rounded-full px-5" type="submit">
                Search
              </button>
            </form>
            {search && (
              <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-content">
                  {totalCount} {totalCount === 1 ? 'post' : 'posts'} matching “{search}”
                </span>
                <button
                  className="link link-primary font-bold"
                  onClick={() => setSearchParams({})}
                  type="button"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="kiwi-page-wide grid gap-8 py-8 lg:grid-cols-[21rem_minmax(0,1fr)] lg:items-start">
        <aside className="lg:sticky lg:top-24">
          {auth.isPending ? (
            <div aria-label="Checking publishing access" className="kiwi-panel space-y-3 p-5">
              <div className="skeleton h-7 w-40" />
              <div className="skeleton h-24 w-full" />
            </div>
          ) : canWrite ? (
            <SocialPostComposer />
          ) : (
            <section className="kiwi-panel p-6 text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/12 text-primary">
                <Sparkles aria-hidden="true" className="size-6" />
              </span>
              <h2 className="mt-4 text-2xl">Add your action</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-content">
                Anyone can browse. Sign in to publish, like, comment, and reply.
              </p>
              <Link className="btn btn-primary mt-5 w-full rounded-full" to="/login">
                Sign in to participate
              </Link>
            </section>
          )}
        </aside>

        <section aria-busy={feed.isPending} aria-label="Community post feed">
          {feed.isPending && (
            <div aria-label="Loading community posts" className="columns-1 gap-5 md:columns-2 xl:columns-3">
              {[11, 16, 13, 18, 14, 12].map((height, index) => (
                <div className="kiwi-panel mb-5 inline-block w-full break-inside-avoid p-4" key={index}>
                  <div className="flex gap-3">
                    <div className="skeleton size-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="skeleton h-4 w-2/3" />
                      <div className="skeleton h-3 w-1/3" />
                    </div>
                  </div>
                  <div className="skeleton mt-4 w-full rounded-xl" style={{ height: `${height}rem` }} />
                </div>
              ))}
            </div>
          )}

          {feed.isError && (
            <section className="kiwi-panel p-8 text-center" role="alert">
              <MessageCircle aria-hidden="true" className="mx-auto size-10 text-error" />
              <h2 className="mt-4 text-2xl">The community feed is unavailable.</h2>
              <p className="mt-2 text-muted-content">Check your connection and try again.</p>
              <button
                className="btn btn-primary mt-5 rounded-full"
                onClick={() => void feed.refetch()}
                type="button"
              >
                Retry
              </button>
            </section>
          )}

          {feed.isSuccess && posts.length === 0 && (
            <section className="kiwi-panel p-8 text-center">
              <Search aria-hidden="true" className="mx-auto size-10 text-primary" />
              <h2 className="mt-4 text-2xl">
                {search ? 'No posts match this search.' : 'No community posts yet.'}
              </h2>
              <p className="mt-2 text-muted-content">
                {search ? 'Try a broader phrase or clear the search.' : 'Be the first to share a local action.'}
              </p>
              {search && (
                <button
                  className="btn btn-primary mt-5 rounded-full"
                  onClick={() => setSearchParams({})}
                  type="button"
                >
                  Clear search
                </button>
              )}
            </section>
          )}

          {posts.length > 0 && (
            <div className="columns-1 gap-5 md:columns-2 xl:columns-3">
              {posts.map((post) => (
                <SocialPostCard canWrite={canWrite} key={post.id} post={post} />
              ))}
            </div>
          )}

          {feed.hasNextPage && (
            <div className="mt-3 flex justify-center">
              <button
                className="btn btn-outline rounded-full px-8"
                disabled={feed.isFetchingNextPage}
                onClick={() => void feed.fetchNextPage()}
                type="button"
              >
                {feed.isFetchingNextPage ? 'Loading more…' : 'Load more stories'}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
