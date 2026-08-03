import { Heart, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSetSocialLike } from '../../hooks/useSocialFeed';
import { ApiError } from '../../lib/api/apiFetch';
import type { SocialPostDto } from '../../types/social';
import SocialComments from './SocialComments';

interface SocialPostCardProps {
  post: SocialPostDto;
  canWrite: boolean;
}

export default function SocialPostCard({ post, canWrite }: SocialPostCardProps) {
  const setLike = useSetSocialLike();
  const likeError = setLike.error instanceof ApiError && setLike.error.status === 429
    ? 'Please wait before reacting again.'
    : setLike.isError
      ? 'Like could not be updated.'
      : null;

  return (
    <article className="kiwi-panel mb-5 inline-block w-full break-inside-avoid overflow-hidden align-top">
      <header className="flex items-center gap-3 p-4 pb-3">
        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/12 font-extrabold text-primary"
        >
          {post.authorDisplayName.slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate font-extrabold">{post.authorDisplayName}</p>
          <time className="block text-xs text-muted-content" dateTime={post.createdAtUtc}>
            {formatTime(post.createdAtUtc)}
          </time>
        </div>
      </header>

      {post.imageUrl && post.imageAltText && (
        <img
          alt={post.imageAltText}
          className="max-h-[34rem] w-full bg-base-200 object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
          src={post.imageUrl}
        />
      )}

      <div className="space-y-3 p-4 pt-3">
        <p className="whitespace-pre-wrap break-words text-[0.95rem] leading-7">
          {post.content}
        </p>
        <div className="flex items-center justify-between gap-3">
          {canWrite ? (
            <button
              aria-label={post.isLikedByViewer ? 'Unlike post' : 'Like post'}
              aria-pressed={post.isLikedByViewer}
              className={`btn btn-sm rounded-full ${
                post.isLikedByViewer ? 'btn-primary' : 'btn-ghost'
              }`}
              disabled={setLike.isPending}
              onClick={() => setLike.mutate({
                postId: post.id,
                isLiked: !post.isLikedByViewer,
              })}
              type="button"
            >
              <Heart
                aria-hidden="true"
                className="size-4"
                fill={post.isLikedByViewer ? 'currentColor' : 'none'}
              />
              {post.likeCount}
            </button>
          ) : (
            <Link className="btn btn-ghost btn-sm rounded-full" to="/login">
              <LogIn aria-hidden="true" className="size-4" />
              Sign in to like · {post.likeCount}
            </Link>
          )}
        </div>
        {likeError && <p className="text-sm text-error" role="alert">{likeError}</p>}
        <SocialComments
          canWrite={canWrite}
          commentCount={post.commentCount}
          postId={post.id}
        />
      </div>
    </article>
  );
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}
