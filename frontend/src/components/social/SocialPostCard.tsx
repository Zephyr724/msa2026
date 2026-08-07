import { Heart, ImageIcon, Images, LockKeyhole, ShieldCheck } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useSetSocialLike } from '../../hooks/useSocialFeed';
import type { SocialPostDto } from '../../types/social';

export default function SocialPostCard({
  post,
  canLike,
}: {
  post: SocialPostDto;
  canLike: boolean;
}) {
  const location = useLocation();
  const setLike = useSetSocialLike();
  const cover = post.images[0];
  const likeLabel = post.isLikedByViewer ? 'Unlike post' : 'Like post';

  return (
    <article className="relative mb-5 inline-block w-full break-inside-avoid align-top">
      <Link
        aria-label={`Open post: ${post.title}`}
        className="group block overflow-hidden rounded-2xl bg-base-100 shadow-[0_4px_18px_rgba(24,48,38,0.08)] ring-1 ring-base-300/70 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(24,48,38,0.14)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        state={{ communityReturn: `${location.pathname}${location.search}` }}
        to={`/community/posts/${post.id}`}
      >
        <div className="relative overflow-hidden bg-base-200">
          {cover ? (
            <img
              alt={cover.imageAltText}
              className="aspect-[4/5] w-full object-cover transition duration-300 group-hover:scale-[1.015]"
              loading="lazy"
              referrerPolicy="no-referrer"
              src={cover.imageUrl}
            />
          ) : (
            <div className="kiwi-topography grid aspect-[4/3] place-items-center bg-gradient-to-br from-primary/15 via-secondary/70 to-accent/15 p-6 text-center">
              <span className="grid size-14 place-items-center rounded-full bg-base-100/75 text-primary shadow-sm">
                <ImageIcon aria-hidden="true" className="size-6" />
              </span>
            </div>
          )}
          {post.images.length > 1 && (
            <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-1 text-xs font-bold text-white">
              <Images aria-hidden="true" className="size-3.5" />
              {post.images.length}
            </span>
          )}
          {post.isHidden && (
            <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-1 text-xs font-bold text-white">
              <LockKeyhole aria-hidden="true" className="size-3.5" />
              Only you
            </span>
          )}
          {post.isVerifiedQuestStory && (
            <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-primary/90 px-2 py-1 text-[0.65rem] font-black uppercase tracking-wide text-primary-content shadow-sm">
              <ShieldCheck aria-hidden="true" className="size-3.5" /> Verified Story
            </span>
          )}
        </div>

        <div className="p-3.5">
          <h2 className="line-clamp-2 break-words text-[0.98rem] font-extrabold leading-snug">
            {post.title}
          </h2>
          {post.quest && (
            <p className="mt-1.5 truncate text-[0.7rem] font-semibold text-primary/80">
              Quest · {post.quest.title}
            </p>
          )}
          <div className="mt-3 flex items-center gap-2 pr-12 text-xs text-muted-content">
            <span aria-hidden="true" className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-[0.65rem] font-extrabold text-primary">
              {post.authorDisplayName.slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1 truncate font-semibold">{post.authorDisplayName}</span>
          </div>
        </div>
      </Link>

      {canLike ? (
        <button
          aria-label={likeLabel}
          aria-pressed={post.isLikedByViewer}
          className="absolute bottom-3.5 right-3.5 z-10 inline-flex min-h-8 items-center gap-1 rounded-full px-2 text-xs font-semibold text-muted-content transition hover:bg-primary/10 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-60"
          disabled={setLike.isPending}
          onClick={() => setLike.mutate({ postId: post.id, isLiked: !post.isLikedByViewer })}
          type="button"
        >
          <Heart aria-hidden="true" className="size-4" fill={post.isLikedByViewer ? 'currentColor' : 'none'} />
          {post.likeCount}
        </button>
      ) : (
        <Link
          aria-label="Sign in to like post"
          className="absolute bottom-3.5 right-3.5 z-10 inline-flex min-h-8 items-center gap-1 rounded-full px-2 text-xs font-semibold text-muted-content transition hover:bg-primary/10 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          to="/login"
        >
          <Heart aria-hidden="true" className="size-4" />
          {post.likeCount}
        </Link>
      )}
    </article>
  );
}
