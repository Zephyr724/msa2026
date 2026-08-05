import {
  ArrowLeft,
  CalendarDays,
  Eye,
  EyeOff,
  Heart,
  ImageIcon,
  Link2,
  MapPin,
  MessageCircle,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import SocialComments from '../components/social/SocialComments';
import SocialPostDeleteDialog from '../components/social/SocialPostDeleteDialog';
import SocialPostImageCarousel from '../components/social/SocialPostImageCarousel';
import SocialPostComposer from '../components/social/SocialPostComposer';
import { useAuthQuery } from '../hooks/useAuth';
import {
  useDeleteSocialPost,
  useSetSocialLike,
  useSetSocialPostVisibility,
  useSocialPost,
} from '../hooks/useSocialFeed';
import { ApiError } from '../lib/api/apiFetch';

export default function SocialPostDetailPage() {
  const { postId = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuthQuery();
  const postQuery = useSocialPost(postId);
  const setLike = useSetSocialLike();
  const setVisibility = useSetSocialPostVisibility();
  const deletePost = useDeleteSocialPost();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const post = postQuery.data;
  const returnTo = typeof location.state === 'object' &&
    location.state !== null &&
    'communityReturn' in location.state &&
    typeof location.state.communityReturn === 'string'
    ? location.state.communityReturn
    : '/community';

  async function confirmDelete() {
    if (!post) return;
    try {
      await deletePost.mutateAsync(post.id);
      navigate('/community?view=mine', { replace: true });
    } catch {
      // The confirmation dialog keeps the bounded error visible.
    }
  }

  const deleteError = deletePost.error instanceof ApiError && deletePost.error.status === 429
    ? 'Please wait before deleting this post.'
    : deletePost.isError
      ? 'This post could not be deleted.'
      : null;
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-base-100 md:grid md:place-items-center md:bg-black/50 md:p-6">
      {postQuery.isPending && (
        <div aria-label="Loading post" className="grid min-h-screen place-items-center md:min-h-0">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      )}

      {postQuery.isError && (
        <section className="mx-auto grid min-h-screen max-w-lg place-content-center px-6 text-center md:min-h-0 md:rounded-3xl md:bg-base-100 md:p-12">
          <MessageCircle aria-hidden="true" className="mx-auto size-12 text-primary" />
          <h1 className="mt-4 text-2xl">This post is not available.</h1>
          <p className="mt-2 text-muted-content">It may be private, deleted, or the link may be incorrect.</p>
          <Link className="btn btn-primary mt-6 rounded-full" to="/community">Back to Community</Link>
        </section>
      )}

      {post && (
        <article className="relative min-h-screen w-full bg-base-100 md:grid md:h-[min(90vh,860px)] md:min-h-0 md:max-w-7xl md:grid-cols-[minmax(0,1.35fr)_minmax(22rem,0.8fr)] md:overflow-hidden md:rounded-3xl md:shadow-2xl">
          <button
            aria-label="Close post"
            className="btn btn-circle btn-sm absolute left-3 top-3 z-20 border-white/30 bg-black/60 text-white hover:bg-black/80 md:left-4 md:top-4 md:btn-md"
            onClick={() => navigate(returnTo)}
            type="button"
          >
            <X aria-hidden="true" className="hidden size-5 md:block" />
            <ArrowLeft aria-hidden="true" className="size-5 md:hidden" />
          </button>

          <header className="flex h-16 items-center gap-3 border-b border-base-300 bg-base-100 pl-14 pr-3 md:hidden">
            <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/12 text-sm font-extrabold text-primary">{post.authorDisplayName.slice(0, 1).toUpperCase()}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-extrabold">{post.authorDisplayName}</p>
              <time className="text-[0.65rem] text-muted-content" dateTime={post.createdAtUtc}>{formatDate(post.createdAtUtc)}</time>
            </div>
            {post.isHidden && <span className="badge badge-warning badge-sm gap-1"><EyeOff aria-hidden="true" className="size-3" />Only you</span>}
            {post.canDelete && (
              <div className="flex">
                <button aria-label="Edit post" className="btn btn-ghost btn-sm btn-square" onClick={() => setEditOpen(true)} type="button"><Pencil aria-hidden="true" className="size-4" /></button>
                <button aria-label={post.isHidden ? 'Make post public' : 'Hide post'} className="btn btn-ghost btn-sm btn-square" disabled={setVisibility.isPending} onClick={() => setVisibility.mutate({ postId: post.id, isHidden: !post.isHidden })} type="button">
                  {post.isHidden ? <Eye aria-hidden="true" className="size-4" /> : <EyeOff aria-hidden="true" className="size-4" />}
                </button>
                <button aria-label="Delete post" className="btn btn-ghost btn-sm btn-square text-error" onClick={() => setDeleteOpen(true)} type="button"><Trash2 aria-hidden="true" className="size-4" /></button>
              </div>
            )}
          </header>

          <div className="bg-neutral md:min-h-0">
            {post.images.length > 0 ? (
              <SocialPostImageCarousel detail images={post.images} />
            ) : (
              <div className="kiwi-topography grid aspect-[4/3] place-items-center bg-gradient-to-br from-primary/20 via-secondary to-accent/15 text-primary md:h-full md:aspect-auto">
                <span className="grid size-20 place-items-center rounded-full bg-base-100/80 shadow-lg"><ImageIcon aria-hidden="true" className="size-9" /></span>
              </div>
            )}
          </div>

          <div className="flex min-h-0 flex-col bg-base-100">
            <div className="flex-1 px-5 pb-24 pt-5 md:overflow-y-auto md:px-7 md:pb-6 md:pt-6">
              <header className="hidden items-center gap-3 border-b border-base-300 pb-4 md:flex">
                <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/12 font-extrabold text-primary">{post.authorDisplayName.slice(0, 1).toUpperCase()}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-extrabold">{post.authorDisplayName}</p>
                  <time className="text-xs text-muted-content" dateTime={post.createdAtUtc}>{formatDate(post.createdAtUtc)}</time>
                </div>
                {post.isHidden && <span className="badge badge-warning gap-1"><EyeOff aria-hidden="true" className="size-3" />Only you</span>}
                {post.canDelete && (
                  <div className="flex">
                    <button aria-label="Edit post" className="btn btn-ghost btn-sm btn-square" onClick={() => setEditOpen(true)} title="Edit post" type="button"><Pencil aria-hidden="true" className="size-4" /></button>
                    <button aria-label={post.isHidden ? 'Make post public' : 'Hide post'} className="btn btn-ghost btn-sm btn-square" disabled={setVisibility.isPending} onClick={() => setVisibility.mutate({ postId: post.id, isHidden: !post.isHidden })} title={post.isHidden ? 'Make public' : 'Hide from everyone else'} type="button">
                      {post.isHidden ? <Eye aria-hidden="true" className="size-4" /> : <EyeOff aria-hidden="true" className="size-4" />}
                    </button>
                    <button aria-label="Delete post" className="btn btn-ghost btn-sm btn-square text-error" onClick={() => setDeleteOpen(true)} type="button"><Trash2 aria-hidden="true" className="size-4" /></button>
                  </div>
                )}
              </header>

              <div className="py-5">
                <h1 className="break-words text-2xl leading-tight">{post.title}</h1>
                <p className="mt-3 whitespace-pre-wrap break-words text-[0.95rem] leading-7">{post.content}</p>
                {post.tags.length > 0 && (
                  <div aria-label="Post tags" className="mt-3 flex flex-wrap gap-x-2 gap-y-1">{post.tags.map((tag) => <span className="break-all text-sm font-bold text-primary" key={tag}>#{tag}</span>)}</div>
                )}

                {post.quest && (
                  <Link className="group mt-5 flex items-center gap-3 rounded-2xl border border-base-300 bg-base-200/60 p-3 transition hover:border-primary/40 hover:bg-primary/5" to={`/quests/${post.quest.id}`}>
                    {post.quest.coverImageUrl ? <img alt="" className="size-11 shrink-0 rounded-xl object-cover" src={post.quest.coverImageUrl} /> : <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Link2 className="size-5" /></span>}
                    <span className="min-w-0 flex-1">
                      <span className="text-[0.65rem] font-bold uppercase tracking-wide text-muted-content">Related Quest</span>
                      <strong className="block truncate text-sm group-hover:text-primary">{post.quest.title}</strong>
                      <span className="mt-0.5 flex flex-wrap gap-x-3 text-[0.7rem] text-muted-content">
                        {post.quest.startAtUtc && <span className="inline-flex items-center gap-1"><CalendarDays aria-hidden="true" className="size-3" />{formatDate(post.quest.startAtUtc)}</span>}
                        {post.quest.locationDescription && <span className="inline-flex min-w-0 items-center gap-1"><MapPin aria-hidden="true" className="size-3" /><span className="truncate">{post.quest.locationDescription}</span></span>}
                      </span>
                    </span>
                  </Link>
                )}
              </div>

              {visibilityError && <p className="mb-3 text-sm text-error" role="alert">{visibilityError}</p>}
              {likeError && <p className="mb-3 text-sm text-error" role="alert">{likeError}</p>}
              <SocialComments canWrite={Boolean(auth.data)} commentCount={post.commentCount} postId={post.id} />
            </div>

            <footer className="fixed inset-x-0 bottom-0 z-20 flex items-center gap-2 border-t border-base-300 bg-base-100/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:static md:px-7">
              {auth.data ? (
                <button aria-label={post.isLikedByViewer ? 'Unlike post' : 'Like post'} aria-pressed={post.isLikedByViewer} className={`btn flex-1 rounded-full ${post.isLikedByViewer ? 'btn-primary' : 'btn-ghost'}`} disabled={setLike.isPending} onClick={() => setLike.mutate({ postId: post.id, isLiked: !post.isLikedByViewer })} type="button">
                  <Heart aria-hidden="true" className="size-5" fill={post.isLikedByViewer ? 'currentColor' : 'none'} />{post.likeCount}
                </button>
              ) : (
                <Link className="btn btn-ghost flex-1 rounded-full" to="/login"><Heart aria-hidden="true" className="size-5" />{post.likeCount}</Link>
              )}
              <a className="btn btn-ghost flex-1 rounded-full" href="#post-comments-heading"><MessageCircle aria-hidden="true" className="size-5" />{post.commentCount}</a>
            </footer>
          </div>
        </article>
      )}

      {post && (
        <SocialPostDeleteDialog error={deleteError} onClose={() => { deletePost.reset(); setDeleteOpen(false); }} onConfirm={() => void confirmDelete()} open={deleteOpen} pending={deletePost.isPending} postId={post.id} title={post.title} />
      )}
      {post && (
        <SocialPostComposer
          onClose={() => setEditOpen(false)}
          onPublished={() => setEditOpen(false)}
          open={editOpen}
          post={post}
        />
      )}
    </div>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
}
