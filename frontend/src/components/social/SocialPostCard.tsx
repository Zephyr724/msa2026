import { Heart, Images, LockKeyhole } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSetSocialLike } from '../../hooks/useSocialFeed';
import { getSocialCoverCrop, type SocialCoverCrop } from '../../lib/socialCoverRatio';
import { resolveSocialImageUrl } from '../../lib/socialImages';
import type { SocialPostDto } from '../../types/social';
import SocialPostTextCover from './SocialPostTextCover';

export default function SocialPostCard({
  post,
  canLike,
}: {
  post: SocialPostDto;
  canLike: boolean;
}) {
  const location = useLocation();
  const setLike = useSetSocialLike();
  const [coverCrop, setCoverCrop] = useState<SocialCoverCrop>(null);
  const [failedCoverUrl, setFailedCoverUrl] = useState<string | null>(null);
  const cover = post.images[0];
  const coverFailed = cover?.imageUrl === failedCoverUrl;
  const likeLabel = post.isLikedByViewer ? 'Unlike post' : 'Like post';

  return (
    <article className="relative w-full">
      <Link
        aria-label={`Open post: ${post.title}`}
        className="group block overflow-hidden rounded-2xl bg-base-100 shadow-[0_4px_18px_rgba(24,48,38,0.08)] ring-1 ring-base-300/70 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(24,48,38,0.14)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        state={{ communityReturn: `${location.pathname}${location.search}` }}
        to={`/community/posts/${post.id}`}
      >
        <div className="relative overflow-hidden bg-base-200">
          {cover && !coverFailed ? (
            <img
              alt={cover.imageAltText}
              className={`${coverCrop === 'tall' ? 'aspect-[19/25] object-cover' : coverCrop === 'wide' ? 'aspect-[4/3] object-cover' : 'h-auto'} w-full transition duration-300 group-hover:scale-[1.015]`}
              loading="lazy"
              onError={() => setFailedCoverUrl(cover.imageUrl)}
              onLoad={(event) => {
                const image = event.currentTarget;
                setCoverCrop(getSocialCoverCrop(image.naturalWidth, image.naturalHeight));
              }}
              referrerPolicy="no-referrer"
              src={resolveSocialImageUrl(cover.imageUrl)}
            />
          ) : (
            <SocialPostTextCover content={post.content} fallback={post.title} />
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
          className="absolute bottom-3.5 right-3.5 z-10 inline-flex min-h-8 items-center gap-1 rounded-full px-2 text-xs font-semibold text-muted-content transition hover:bg-impact/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-impact disabled:cursor-wait disabled:opacity-60"
          disabled={setLike.isPending}
          onClick={() => setLike.mutate({ postId: post.id, isLiked: !post.isLikedByViewer })}
          type="button"
        >
          <Heart aria-hidden="true" className="size-4 text-impact" fill={post.isLikedByViewer ? 'currentColor' : 'none'} />
          {post.likeCount}
        </button>
      ) : (
        <Link
          aria-label="Sign in to like post"
          className="absolute bottom-3.5 right-3.5 z-10 inline-flex min-h-8 items-center gap-1 rounded-full px-2 text-xs font-semibold text-muted-content transition hover:bg-impact/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-impact"
          to="/login"
        >
          <Heart aria-hidden="true" className="size-4 text-impact" />
          {post.likeCount}
        </Link>
      )}
    </article>
  );
}
