import { CornerDownRight, MessageCircle, Send } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useCreateSocialComment,
  useSocialComments,
} from '../../hooks/useSocialFeed';
import { ApiError } from '../../lib/api/apiFetch';

interface SocialCommentsProps {
  postId: string;
  commentCount: number;
  canWrite: boolean;
}

export default function SocialComments({
  postId,
  commentCount,
  canWrite,
}: SocialCommentsProps) {
  const [expanded, setExpanded] = useState(false);
  const [content, setContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const comments = useSocialComments(postId, expanded);
  const createComment = useCreateSocialComment(postId);

  async function submit(
    event: FormEvent<HTMLFormElement>,
    parentCommentId: string | null,
  ) {
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
      // The bounded error below covers comment and reply failures.
    }
  }

  const threads = comments.data?.pages.flatMap((page) => page.items) ?? [];
  const mutationError = createComment.error instanceof ApiError &&
    createComment.error.status === 429
    ? 'You are commenting quickly. Wait a moment and try again.'
    : createComment.isError
      ? 'Your comment could not be added. Please try again.'
      : null;

  return (
    <div className="border-t border-base-300 pt-3">
      <button
        aria-expanded={expanded}
        className="btn btn-ghost btn-sm -ml-2 rounded-full"
        onClick={() => setExpanded((value) => !value)}
        type="button"
      >
        <MessageCircle aria-hidden="true" className="size-4" />
        {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
      </button>

      {expanded && (
        <div className="mt-3 space-y-4">
          {comments.isPending && (
            <div aria-label="Loading comments" className="space-y-2">
              <div className="skeleton h-14 w-full rounded-xl" />
              <div className="skeleton ml-6 h-12 w-[calc(100%-1.5rem)] rounded-xl" />
            </div>
          )}
          {comments.isError && (
            <div className="rounded-xl bg-error/10 p-3 text-sm text-error" role="alert">
              Comments could not be loaded.{' '}
              <button className="link font-bold" onClick={() => void comments.refetch()} type="button">
                Retry
              </button>
            </div>
          )}
          {comments.isSuccess && threads.length === 0 && (
            <p className="rounded-xl bg-base-200 p-3 text-sm text-muted-content">
              No comments yet. Start a constructive conversation.
            </p>
          )}

          {threads.map((thread) => (
            <article className="space-y-2" key={thread.id}>
              <div className="rounded-2xl bg-base-200 p-3">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <strong>{thread.authorDisplayName}</strong>
                  <time className="text-muted-content" dateTime={thread.createdAtUtc}>
                    {formatTime(thread.createdAtUtc)}
                  </time>
                </div>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed">
                  {thread.content}
                </p>
                {canWrite && (
                  <button
                    className="btn btn-ghost btn-xs mt-1 -ml-2 rounded-full"
                    onClick={() => {
                      setReplyingTo((value) => value === thread.id ? null : thread.id);
                      setReplyContent('');
                    }}
                    type="button"
                  >
                    <CornerDownRight aria-hidden="true" className="size-3.5" />
                    Reply
                  </button>
                )}
              </div>

              {thread.replies.map((reply) => (
                <div className="ml-6 rounded-2xl border border-base-300 bg-base-100 p-3" key={reply.id}>
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <strong>{reply.authorDisplayName}</strong>
                    <time className="text-muted-content" dateTime={reply.createdAtUtc}>
                      {formatTime(reply.createdAtUtc)}
                    </time>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed">
                    {reply.content}
                  </p>
                </div>
              ))}

              {thread.hasMoreReplies && (
                <p className="ml-6 text-xs text-muted-content">
                  Showing the first {thread.replies.length} of {thread.replyCount} replies.
                </p>
              )}

              {replyingTo === thread.id && (
                <form className="ml-6 flex gap-2" onSubmit={(event) => void submit(event, thread.id)}>
                  <label className="sr-only" htmlFor={`reply-${thread.id}`}>Write a reply</label>
                  <input
                    className="input input-bordered input-sm min-w-0 flex-1 rounded-full"
                    id={`reply-${thread.id}`}
                    maxLength={1_000}
                    onChange={(event) => setReplyContent(event.target.value)}
                    placeholder={`Reply to ${thread.authorDisplayName}`}
                    value={replyContent}
                  />
                  <button
                    aria-label="Send reply"
                    className="btn btn-primary btn-sm btn-circle"
                    disabled={createComment.isPending || !replyContent.trim()}
                    type="submit"
                  >
                    <Send aria-hidden="true" className="size-4" />
                  </button>
                </form>
              )}
            </article>
          ))}

          {comments.hasNextPage && (
            <button
              className="btn btn-ghost btn-sm w-full rounded-full"
              disabled={comments.isFetchingNextPage}
              onClick={() => void comments.fetchNextPage()}
              type="button"
            >
              {comments.isFetchingNextPage ? 'Loading…' : 'Load earlier comments'}
            </button>
          )}

          {canWrite ? (
            <form className="flex gap-2" onSubmit={(event) => void submit(event, null)}>
              <label className="sr-only" htmlFor={`comment-${postId}`}>Add a comment</label>
              <input
                className="input input-bordered input-sm min-w-0 flex-1 rounded-full"
                id={`comment-${postId}`}
                maxLength={1_000}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Add a comment…"
                value={content}
              />
              <button
                aria-label="Send comment"
                className="btn btn-primary btn-sm btn-circle"
                disabled={createComment.isPending || !content.trim()}
                type="submit"
              >
                <Send aria-hidden="true" className="size-4" />
              </button>
            </form>
          ) : (
            <p className="text-sm text-muted-content">
              <Link className="link link-primary font-bold" to="/login">Sign in</Link>
              {' '}to join the conversation.
            </p>
          )}
          {mutationError && <p className="text-sm text-error" role="alert">{mutationError}</p>}
        </div>
      )}
    </div>
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
