import {
  CalendarDays,
  Eye,
  EyeOff,
  Heart,
  Link2,
  LogIn,
  MapPin,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useDeleteSocialPost,
  useSetSocialLike,
  useSetSocialPostVisibility,
} from '../../hooks/useSocialFeed';
import { ApiError } from '../../lib/api/apiFetch';
import type { SocialPostDto } from '../../types/social';
import SocialComments from './SocialComments';
import SocialPostDeleteDialog from './SocialPostDeleteDialog';
import SocialPostImageCarousel from './SocialPostImageCarousel';

interface SocialPostCardProps {
  post: SocialPostDto;
  canWrite: boolean;
}

export default function SocialPostCard({ post, canWrite }: SocialPostCardProps) {
  const setLike = useSetSocialLike();
  const setVisibility = useSetSocialPostVisibility();
  const deletePost = useDeleteSocialPost();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const likeError = setLike.error instanceof ApiError && setLike.error.status === 429
    ? 'Please wait before reacting again.'
    : setLike.isError
      ? 'Like could not be updated.'
      : null;
  const visibilityError = setVisibility.error instanceof ApiError && setVisibility.error.status === 429
    ? 'Please wait before changing visibility again.'
    : setVisibility.isError
      ? 'Visibility could not be changed.'
      : null;
  const deleteError = deletePost.error instanceof ApiError && deletePost.error.status === 429
    ? 'Please wait before deleting this post.'
    : deletePost.isError
      ? 'This post could not be deleted.'
      : null;

  async function confirmDelete() {
    try {
      await deletePost.mutateAsync(post.id);
      setDeleteOpen(false);
    } catch {
      // The confirmation dialog keeps the bounded error visible.
    }
  }

  return (
    <article className="kiwi-panel mb-5 inline-block w-full break-inside-avoid overflow-hidden align-top">
      <header className="flex items-center gap-3 p-4 pb-3">
        <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/12 font-extrabold text-primary">
          {post.authorDisplayName.slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-extrabold">{post.authorDisplayName}</p>
          <time className="block text-xs text-muted-content" dateTime={post.createdAtUtc}>{formatTime(post.createdAtUtc)}</time>
        </div>
        {post.isHidden && (
          <span className="badge gap-1 border-warning/30 bg-warning/10 text-warning-content">
            <EyeOff aria-hidden="true" className="size-3" /> Only you
          </span>
        )}
        {post.canDelete && (
          <div className="flex shrink-0">
            <button
              aria-label={post.isHidden ? 'Make post public' : 'Hide post'}
              className="btn btn-ghost btn-sm btn-square"
              disabled={setVisibility.isPending}
              onClick={() => setVisibility.mutate({ postId: post.id, isHidden: !post.isHidden })}
              title={post.isHidden ? 'Make public' : 'Hide from everyone else'}
              type="button"
            >
              {post.isHidden ? <Eye aria-hidden="true" className="size-4" /> : <EyeOff aria-hidden="true" className="size-4" />}
            </button>
            <button aria-label="Delete post" className="btn btn-ghost btn-sm btn-square text-error" onClick={() => setDeleteOpen(true)} type="button">
              <Trash2 aria-hidden="true" className="size-4" />
            </button>
          </div>
        )}
      </header>

      <SocialPostImageCarousel images={post.images} />

      <div className="space-y-3 p-4 pt-3">
        <h2 className="break-words text-xl leading-snug">{post.title}</h2>
        {post.quest && (
          <Link className="group flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/7 p-3 transition-colors hover:border-primary/45" to={`/quests/${post.quest.id}`}>
            {post.quest.coverImageUrl ? (
              <img
                alt=""
                className="size-12 shrink-0 rounded-xl object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
                src={post.quest.coverImageUrl}
              />
            ) : (
              <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary"><Link2 className="size-5" /></span>
            )}
            <span className="min-w-0 flex-1">
              <span className="kiwi-stat-label">Related Quest</span>
              <strong className="mt-0.5 block truncate group-hover:text-primary">{post.quest.title}</strong>
              <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-content">
                {post.quest.startAtUtc && <span className="inline-flex items-center gap-1"><CalendarDays aria-hidden="true" className="size-3" />{formatDate(post.quest.startAtUtc)}</span>}
                {post.quest.locationDescription && <span className="inline-flex min-w-0 items-center gap-1"><MapPin aria-hidden="true" className="size-3" /><span className="truncate">{post.quest.locationDescription}</span></span>}
              </span>
            </span>
          </Link>
        )}
        <p className="whitespace-pre-wrap break-words text-[0.95rem] leading-7">{post.content}</p>
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2" aria-label="Post tags">
            {post.tags.map((tag) => <span className="break-all text-sm font-bold text-primary" key={tag}>#{tag}</span>)}
          </div>
        )}
        <div className="flex items-center justify-between gap-3">
          {canWrite ? (
            <button
              aria-label={post.isLikedByViewer ? 'Unlike post' : 'Like post'}
              aria-pressed={post.isLikedByViewer}
              className={`btn btn-sm rounded-full ${post.isLikedByViewer ? 'btn-primary' : 'btn-ghost'}`}
              disabled={setLike.isPending}
              onClick={() => setLike.mutate({ postId: post.id, isLiked: !post.isLikedByViewer })}
              type="button"
            >
              <Heart aria-hidden="true" className="size-4" fill={post.isLikedByViewer ? 'currentColor' : 'none'} />
              {post.likeCount}
            </button>
          ) : (
            <Link className="btn btn-ghost btn-sm rounded-full" to="/login"><LogIn aria-hidden="true" className="size-4" />Sign in to like · {post.likeCount}</Link>
          )}
        </div>
        {likeError && <p className="text-sm text-error" role="alert">{likeError}</p>}
        {visibilityError && <p className="text-sm text-error" role="alert">{visibilityError}</p>}
        <SocialComments canWrite={canWrite} commentCount={post.commentCount} postId={post.id} />
      </div>

      <SocialPostDeleteDialog
        error={deleteError}
        onClose={() => {
          deletePost.reset();
          setDeleteOpen(false);
        }}
        onConfirm={() => void confirmDelete()}
        open={deleteOpen}
        pending={deletePost.isPending}
        postId={post.id}
        title={post.title}
      />
    </article>
  );
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date to be confirmed';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
}
