import { Check, CornerDownRight, Pencil, Send, X } from 'lucide-react';
import { type FormEvent, type ReactNode, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useCreateSocialComment,
  useSocialComments,
  useUpdateSocialComment,
} from '../../hooks/useSocialFeed';
import { ApiError } from '../../lib/api/apiFetch';

interface SocialCommentsProps {
  postId: string;
  commentCount: number;
  canWrite: boolean;
}

export default function SocialComments({ postId, commentCount, canWrite }: SocialCommentsProps) {
  const [content, setContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const comments = useSocialComments(postId, true);
  const createComment = useCreateSocialComment(postId);
  const updateComment = useUpdateSocialComment(postId);

  async function submit(event: FormEvent<HTMLFormElement>, parentCommentId: string | null) {
    event.preventDefault();
    const value = (parentCommentId ? replyContent : content).trim();
    if (!value || value.length > 1_000) return;
    try {
      await createComment.mutateAsync({ content: value, parentCommentId });
      if (parentCommentId) {
        setReplyContent('');
        setReplyingTo(null);
      } else {
        setContent('');
      }
    } catch {
      // A bounded error is rendered below.
    }
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = editingContent.trim();
    if (!editingId || !value || value.length > 1_000) return;
    try {
      await updateComment.mutateAsync({ commentId: editingId, content: value });
      setEditingId(null);
      setEditingContent('');
    } catch {
      // A bounded error is rendered below.
    }
  }

  function beginEdit(id: string, value: string) {
    updateComment.reset();
    setEditingId(id);
    setEditingContent(value);
  }

  const threads = comments.data?.pages.flatMap((page) => page.items) ?? [];
  const createError = createComment.error instanceof ApiError && createComment.error.status === 429
    ? 'You are commenting quickly. Wait a moment and try again.'
    : createComment.isError
      ? 'Your comment could not be added. Please try again.'
      : null;
  const editError = updateComment.error instanceof ApiError && updateComment.error.status === 429
    ? 'Please wait before editing again.'
    : updateComment.isError
      ? 'Your comment could not be updated. Please try again.'
      : null;

  return (
    <section aria-labelledby="post-comments-heading" className="border-t border-base-300 pt-5">
      <h2 className="text-lg" id="post-comments-heading">
        {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
      </h2>

      {canWrite ? (
        <form className="mt-4 flex gap-2" onSubmit={(event) => void submit(event, null)}>
          <label className="sr-only" htmlFor={`comment-${postId}`}>Add a comment</label>
          <input
            className="input input-bordered min-w-0 flex-1 rounded-full bg-base-200"
            id={`comment-${postId}`}
            maxLength={1_000}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Add a comment…"
            value={content}
          />
          <button aria-label="Send comment" className="btn btn-primary btn-circle" disabled={createComment.isPending || !content.trim()} type="submit">
            <Send aria-hidden="true" className="size-4" />
          </button>
        </form>
      ) : (
        <p className="mt-3 text-sm text-muted-content"><Link className="link link-primary font-bold" to="/login">Sign in</Link>{' '}to join the conversation.</p>
      )}
      {createError && <p className="mt-2 text-sm text-error" role="alert">{createError}</p>}

      <div className="mt-5 space-y-6">
        {comments.isPending && (
          <div aria-label="Loading comments" className="space-y-3"><div className="skeleton h-20 w-full rounded-xl" /><div className="skeleton ml-8 h-16 w-[calc(100%-2rem)] rounded-xl" /></div>
        )}
        {comments.isError && (
          <div className="rounded-xl bg-error/10 p-3 text-sm text-error" role="alert">Comments could not be loaded. <button className="link font-bold" onClick={() => void comments.refetch()} type="button">Retry</button></div>
        )}
        {comments.isSuccess && threads.length === 0 && (
          <p className="rounded-xl bg-base-200 p-4 text-sm text-muted-content">No comments yet. Start a constructive conversation.</p>
        )}

        {threads.map((thread) => (
          <article className="space-y-3" key={thread.id}>
            <CommentShell author={thread.authorDisplayName} createdAt={thread.createdAtUtc}>
              {editingId === thread.id ? (
                <EditForm content={editingContent} error={editError} onCancel={() => setEditingId(null)} onChange={setEditingContent} onSubmit={saveEdit} pending={updateComment.isPending} />
              ) : (
                <>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed">{thread.content}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {canWrite && (
                      <button className="btn btn-ghost btn-xs -ml-2 rounded-full" onClick={() => { setReplyingTo((value) => value === thread.id ? null : thread.id); setReplyContent(''); }} type="button">
                        <CornerDownRight aria-hidden="true" className="size-3.5" />Reply
                      </button>
                    )}
                    {thread.canEdit && (
                      <button aria-label={`Edit comment by ${thread.authorDisplayName}`} className="btn btn-ghost btn-xs rounded-full" onClick={() => beginEdit(thread.id, thread.content)} type="button">
                        <Pencil aria-hidden="true" className="size-3" />Edit
                      </button>
                    )}
                  </div>
                </>
              )}
            </CommentShell>

            {thread.replies.map((reply) => (
              <CommentShell author={reply.authorDisplayName} createdAt={reply.createdAtUtc} inset key={reply.id}>
                {editingId === reply.id ? (
                  <EditForm content={editingContent} error={editError} onCancel={() => setEditingId(null)} onChange={setEditingContent} onSubmit={saveEdit} pending={updateComment.isPending} />
                ) : (
                  <>
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed">{reply.content}</p>
                    {reply.canEdit && (
                      <button aria-label={`Edit reply by ${reply.authorDisplayName}`} className="btn btn-ghost btn-xs mt-1 -ml-2 rounded-full" onClick={() => beginEdit(reply.id, reply.content)} type="button">
                        <Pencil aria-hidden="true" className="size-3" />Edit
                      </button>
                    )}
                  </>
                )}
              </CommentShell>
            ))}

            {thread.hasMoreReplies && <p className="ml-10 text-xs font-semibold text-primary">Showing the first {thread.replies.length} of {thread.replyCount} replies.</p>}

            {replyingTo === thread.id && (
              <form className="ml-8 flex gap-2" onSubmit={(event) => void submit(event, thread.id)}>
                <label className="sr-only" htmlFor={`reply-${thread.id}`}>Write a reply</label>
                <input className="input input-bordered input-sm min-w-0 flex-1 rounded-full" id={`reply-${thread.id}`} maxLength={1_000} onChange={(event) => setReplyContent(event.target.value)} placeholder={`Reply to ${thread.authorDisplayName}`} value={replyContent} />
                <button aria-label="Send reply" className="btn btn-primary btn-sm btn-circle" disabled={createComment.isPending || !replyContent.trim()} type="submit"><Send aria-hidden="true" className="size-4" /></button>
              </form>
            )}
          </article>
        ))}

        {comments.hasNextPage && (
          <button className="btn btn-ghost btn-sm w-full rounded-full" disabled={comments.isFetchingNextPage} onClick={() => void comments.fetchNextPage()} type="button">
            {comments.isFetchingNextPage ? 'Loading…' : 'Load earlier comments'}
          </button>
        )}
      </div>
    </section>
  );
}

function CommentShell({ author, children, createdAt, inset = false }: { author: string; children: ReactNode; createdAt: string; inset?: boolean }) {
  return (
    <div className={inset ? 'ml-8 border-l-2 border-base-300 pl-4' : ''}>
      <div className="flex gap-3">
        <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-extrabold text-primary">{author.slice(0, 1).toUpperCase()}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs"><strong>{author}</strong><time className="text-muted-content" dateTime={createdAt}>{formatTime(createdAt)}</time></div>
          {children}
        </div>
      </div>
    </div>
  );
}

function EditForm({ content, error, onCancel, onChange, onSubmit, pending }: { content: string; error: string | null; onCancel: () => void; onChange: (value: string) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; pending: boolean }) {
  return (
    <form className="mt-2" onSubmit={onSubmit}>
      <label className="sr-only" htmlFor="edit-comment">Edit comment</label>
      <textarea autoFocus className="textarea textarea-bordered min-h-20 w-full" id="edit-comment" maxLength={1_000} onChange={(event) => onChange(event.target.value)} value={content} />
      <div className="mt-2 flex gap-2">
        <button className="btn btn-primary btn-xs rounded-full" disabled={pending || !content.trim()} type="submit"><Check aria-hidden="true" className="size-3" />Save</button>
        <button className="btn btn-ghost btn-xs rounded-full" disabled={pending} onClick={onCancel} type="button"><X aria-hidden="true" className="size-3" />Cancel</button>
      </div>
      {error && <p className="mt-2 text-xs text-error" role="alert">{error}</p>}
    </form>
  );
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}
