import {
  CalendarDays,
  ImagePlus,
  Link2,
  MapPin,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import {
  type FormEvent,
  type KeyboardEvent,
  type MouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useQuestList } from '../../hooks/useQuests';
import { useCreateSocialPost, useUpdateSocialPost } from '../../hooks/useSocialFeed';
import { ApiError } from '../../lib/api/apiFetch';
import type { SocialPostDto } from '../../types/social';
import { useVerifiedStoryContext } from '../../hooks/usePublicPassport.ts';

const MAX_IMAGES = 9;
const MAX_TAGS = 10;

interface ImageField {
  url: string;
  altText: string;
}

interface SocialPostComposerProps {
  open: boolean;
  onClose: () => void;
  onPublished: (publishedPost: SocialPostDto) => void;
  post?: SocialPostDto;
  verifiedCompletionId?: string | null;
}

export default function SocialPostComposer({
  open,
  onClose,
  onPublished,
  post,
  verifiedCompletionId = null,
}: SocialPostComposerProps) {
  const createPost = useCreateSocialPost();
  const updatePost = useUpdateSocialPost();
  const isEditing = Boolean(post);
  const isVerifiedStory = Boolean(verifiedCompletionId && !post);
  const storyContext = useVerifiedStoryContext(
    open && isVerifiedStory ? verifiedCompletionId : null,
  );
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const errorTimerRef = useRef<number | null>(null);
  const [questSearch, setQuestSearch] = useState('');
  const [selectedQuestId, setSelectedQuestId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<ImageField[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isHidden, setIsHidden] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const quests = useQuestList({
    page: 1,
    pageSize: 20,
    search: questSearch.trim() || undefined,
    sortBy: 'startAt',
  }, open && !isVerifiedStory);

  const dismissError = useCallback(() => {
    if (errorTimerRef.current !== null) {
      window.clearTimeout(errorTimerRef.current);
      errorTimerRef.current = null;
    }
    setErrorNotice(null);
  }, []);

  const showError = useCallback((message: string) => {
    if (errorTimerRef.current !== null) window.clearTimeout(errorTimerRef.current);
    setErrorNotice(message);
    errorTimerRef.current = window.setTimeout(() => {
      errorTimerRef.current = null;
      setErrorNotice(null);
    }, 8_000);
  }, []);

  useEffect(() => {
    if (!open) return;
    setQuestSearch('');
    setSelectedQuestId(post?.quest?.id ?? '');
    setTitle(post?.title ?? '');
    setContent(post?.content ?? '');
    setImages(post?.images.map((image) => ({
      url: image.imageUrl,
      altText: image.imageAltText,
    })) ?? []);
    setTags(post?.tags ?? []);
    setTagInput('');
    setIsHidden(post?.isHidden ?? false);
    dismissError();
  }, [dismissError, open, post]);

  useEffect(() => {
    if (!open || !isVerifiedStory || !storyContext.data) return;
    setSelectedQuestId(storyContext.data.questId);
    setTitle((current) => current || `My verified impact: ${storyContext.data.questTitle}`);
    setContent((current) => current || `I completed ${storyContext.data.questTitle}. Here is what I did and the impact it made:`);
  }, [isVerifiedStory, open, storyContext.data]);

  useEffect(() => () => {
    if (errorTimerRef.current !== null) window.clearTimeout(errorTimerRef.current);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      returnFocusRef.current = document.activeElement as HTMLElement | null;
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
      queueMicrotask(() => titleRef.current?.focus());
    } else if (!open && dialog.open) {
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
      returnFocusRef.current?.focus();
    }
  }, [open]);

  function resetForm() {
    setQuestSearch('');
    setSelectedQuestId('');
    setTitle('');
    setContent('');
    setImages([]);
    setTags([]);
    setTagInput('');
    setIsHidden(false);
    dismissError();
    createPost.reset();
    updatePost.reset();
  }

  function closeDialog() {
    if (createPost.isPending || updatePost.isPending) return;
    resetForm();
    onClose();
  }

  function addTag() {
    const value = tagInput.trim().replace(/^#+/, '').trim();
    if (!value) return;
    if (value.length > 30) {
      showError('Each tag must be 30 characters or fewer.');
      return;
    }
    if (tags.some((tag) => tag.localeCompare(value, undefined, { sensitivity: 'accent' }) === 0)) {
      showError('That tag is already added.');
      return;
    }
    if (tags.length >= MAX_TAGS) {
      showError(`Add no more than ${MAX_TAGS} tags.`);
      return;
    }
    setTags((current) => [...current, value]);
    setTagInput('');
    dismissError();
  }

  function handleTagKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter' && event.key !== ',') return;
    event.preventDefault();
    addTag();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    dismissError();
    if (isVerifiedStory && !storyContext.data) {
      showError(storyContext.isError
        ? 'This verified completion is unavailable.'
        : 'Verifying your completed Quest…');
      return;
    }
    const normalizedTitle = title.trim();
    const normalizedContent = content.trim();
    if (!normalizedTitle) {
      showError('Add a title for your post.');
      return;
    }
    if (normalizedTitle.length > 120) {
      showError('Post title must be 120 characters or fewer.');
      return;
    }
    if (!normalizedContent) {
      showError('Write something about your local action.');
      return;
    }
    if (normalizedContent.length > 2_000) {
      showError('Post content must be 2,000 characters or fewer.');
      return;
    }

    const normalizedImages = images.map((image) => ({
      imageUrl: image.url.trim(),
      imageAltText: image.altText.trim(),
    }));
    for (const image of normalizedImages) {
      if (!image.imageUrl || !image.imageAltText) {
        showError('Every image needs both an HTTPS URL and a description.');
        return;
      }
      try {
        const url = new URL(image.imageUrl);
        if (url.protocol !== 'https:' || url.username || url.password) throw new Error();
      } catch {
        showError('Every image URL must be a public HTTPS address.');
        return;
      }
      if (image.imageAltText.length > 200) {
        showError('Image descriptions must be 200 characters or fewer.');
        return;
      }
    }

    try {
      if (post) {
        const publishedPost = await updatePost.mutateAsync({
          postId: post.id,
          questId: selectedQuestId || null,
          title: normalizedTitle,
          content: normalizedContent,
          images: normalizedImages,
          tags,
        });
        resetForm();
        onPublished(publishedPost);
      } else {
        const publishedPost = await createPost.mutateAsync({
          questId: selectedQuestId || null,
          title: normalizedTitle,
          content: normalizedContent,
          images: normalizedImages,
          tags,
          isHidden,
          sourceCompletionId: isVerifiedStory ? verifiedCompletionId : null,
        });
        resetForm();
        onPublished(publishedPost);
      }
      onClose();
    } catch {
      // The bounded error below keeps the user's input available for retry.
    }
  }

  const mutation = isEditing ? updatePost : createPost;
  const serverError = mutation.error instanceof ApiError && mutation.error.status === 429
    ? `You are ${isEditing ? 'editing' : 'publishing'} quickly. Wait a moment and try again.`
    : mutation.isError
      ? `Your post could not be ${isEditing ? 'updated' : 'published'}. Check the fields and try again.`
      : null;
  const pending = createPost.isPending || updatePost.isPending;
  const dialogTitleId = isEditing ? 'edit-post-dialog-title' : 'create-post-dialog-title';

  useEffect(() => {
    if (serverError) showError(serverError);
  }, [serverError, showError]);

  return (
    <dialog
      aria-labelledby={dialogTitleId}
      className="modal modal-bottom bg-black/55 p-0 backdrop-blur-sm sm:modal-middle"
      onCancel={(event) => {
        event.preventDefault();
        closeDialog();
      }}
      onClick={(event: MouseEvent<HTMLDialogElement>) => {
        if (event.target === event.currentTarget) closeDialog();
      }}
      ref={dialogRef}
    >
      <div className="modal-box max-h-[94dvh] max-w-3xl overflow-hidden rounded-t-[1.75rem] border border-base-300 bg-base-100 p-0 sm:rounded-[1.75rem]">
        <div className="flex items-start justify-between border-b border-base-300 px-5 py-4 sm:px-6">
          <div>
            <p className="kiwi-stat-label">{isEditing ? 'Refine your impact story' : 'Share an impact story'}</p>
            <h2 className="mt-1 text-2xl" id={dialogTitleId}>{isEditing ? 'Edit post' : 'Create a new post'}</h2>
          </div>
          <button
            aria-label={isEditing ? 'Close edit post dialog' : 'Close create post dialog'}
            className="btn btn-ghost btn-sm btn-square"
            disabled={pending}
            onClick={closeDialog}
            type="button"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>

        <form className="flex max-h-[calc(94dvh-5rem)] flex-col" noValidate onSubmit={handleSubmit}>
          <div className="space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
            <fieldset>
              <legend className="flex items-center gap-2 font-extrabold">
                <Link2 aria-hidden="true" className="size-4 text-primary" />
                Related Quest
                <span className="badge badge-primary badge-sm">Recommended</span>
              </legend>
              <p className="mt-1 text-xs text-muted-content">
                Strongly recommended: connect this story to the action that made it possible. You can publish without one.
              </p>
              {isVerifiedStory && (
                <div className="mt-3 rounded-2xl border border-primary/30 bg-primary/8 p-4">
                  <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-primary">
                    <ShieldCheck aria-hidden="true" className="size-4" /> Verified Quest Story
                  </p>
                  {storyContext.isPending && <p className="mt-2 text-sm text-muted-content">Verifying completed Quest…</p>}
                  {storyContext.isError && <p className="mt-2 text-sm font-semibold text-error">This completion could not be verified.</p>}
                  {storyContext.data && (
                    <>
                      <strong className="mt-2 block">{storyContext.data.questTitle}</strong>
                      <p className="mt-1 text-xs text-muted-content">The Quest is locked to the verified completion. You can edit the story itself.</p>
                    </>
                  )}
                </div>
              )}
              {isEditing && post?.quest && selectedQuestId === post.quest.id && (
                <div className="mt-3 rounded-xl border border-primary/25 bg-primary/8 p-3">
                  <span className="text-[0.65rem] font-bold uppercase tracking-wide text-muted-content">
                    Current related Quest
                  </span>
                  <strong className="mt-0.5 block text-sm text-primary">{post.quest.title}</strong>
                </div>
              )}
              <label className={`relative mt-3 block ${isVerifiedStory ? 'hidden' : ''}`}>
                <span className="sr-only">Search published Quests</span>
                <Search aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-content" />
                <input
                  className="input input-bordered w-full rounded-xl pl-9"
                  disabled={isVerifiedStory}
                  onChange={(event) => setQuestSearch(event.target.value)}
                  placeholder="Search published Quests…"
                  type="search"
                  value={questSearch}
                />
              </label>
              <div className={`mt-3 max-h-52 space-y-2 overflow-y-auto rounded-2xl border border-base-300 bg-base-200/45 p-2 ${isVerifiedStory ? 'hidden' : ''}`}>
                {quests.isPending && <p className="p-3 text-sm text-muted-content">Loading Quests…</p>}
                {quests.isError && (
                  <div className="flex items-center justify-between gap-3 p-3 text-sm text-error">
                    <p>Quests could not be loaded.</p>
                    <button
                      className="btn btn-ghost btn-xs"
                      onClick={() => void quests.refetch()}
                      type="button"
                    >
                      Retry
                    </button>
                  </div>
                )}
                {quests.data?.items.length === 0 && (
                  <p className="p-3 text-sm text-muted-content">No published Quests match.</p>
                )}
                {quests.data?.items.map((quest) => {
                  const selected = selectedQuestId === quest.id;
                  return (
                    <button
                      aria-pressed={selected}
                      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                        selected
                          ? 'border-primary bg-primary/10'
                          : 'border-transparent bg-base-100 hover:border-primary/35'
                      }`}
                      key={quest.id}
                      disabled={isVerifiedStory}
                      onClick={() => {
                        setSelectedQuestId(quest.id);
                        dismissError();
                      }}
                      type="button"
                    >
                      {quest.coverImage ? (
                        <img
                          alt=""
                          className="size-14 shrink-0 rounded-xl object-cover"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          src={quest.coverImage.imageUrl}
                        />
                      ) : (
                        <span aria-hidden="true" className="grid size-14 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                          <Link2 className="size-5" />
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <strong className="block truncate">{quest.title}</strong>
                        <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-content">
                          {quest.startAtUtc && (
                            <span className="inline-flex items-center gap-1">
                              <CalendarDays aria-hidden="true" className="size-3.5" />
                              {formatDate(quest.startAtUtc)}
                            </span>
                          )}
                          {quest.locationDescription && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin aria-hidden="true" className="size-3.5" />
                              {quest.locationDescription}
                            </span>
                          )}
                        </span>
                      </span>
                      <span className={`size-4 rounded-full border-2 ${selected ? 'border-primary bg-primary ring-2 ring-primary/20' : 'border-base-300'}`} />
                    </button>
                  );
                })}
              </div>
              {selectedQuestId && !isVerifiedStory && (
                <button
                  className="btn btn-ghost btn-xs mt-2"
                  onClick={() => setSelectedQuestId('')}
                  type="button"
                >
                  Remove related Quest
                </button>
              )}
            </fieldset>

            <label className="block">
              <span className="mb-2 flex items-center justify-between gap-3 text-sm font-bold">
                Title <span className="font-medium text-muted-content">{title.length}/120</span>
              </span>
              <input
                className="input input-bordered h-12 w-full rounded-xl"
                maxLength={120}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Give your impact story a clear title"
                ref={titleRef}
                value={title}
              />
            </label>

            <section aria-labelledby="post-images-title">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="flex items-center gap-2 font-extrabold" id="post-images-title">
                    <ImagePlus aria-hidden="true" className="size-4 text-primary" />
                    Images <span className="font-medium text-muted-content">(optional)</span>
                  </h3>
                  <p className="mt-1 text-xs text-muted-content">Add up to {MAX_IMAGES} HTTPS image URLs.</p>
                </div>
                <button
                  className="btn btn-outline btn-sm rounded-full"
                  disabled={images.length >= MAX_IMAGES}
                  onClick={() => setImages((current) => [...current, { url: '', altText: '' }])}
                  type="button"
                >
                  <Plus aria-hidden="true" className="size-4" />
                  Add image
                </button>
              </div>
              {images.length > 0 && (
                <div className="mt-3 space-y-3">
                  {images.map((image, index) => (
                    <div className="grid gap-3 rounded-2xl border border-base-300 bg-base-200/45 p-3 sm:grid-cols-[6rem_minmax(0,1fr)_auto]" key={index}>
                      <div className="aspect-square overflow-hidden rounded-xl bg-base-300">
                        {isHttpsUrl(image.url) ? (
                          <img alt="Preview" className="size-full object-cover" referrerPolicy="no-referrer" src={image.url} />
                        ) : (
                          <span className="grid size-full place-items-center text-muted-content"><ImagePlus className="size-5" /></span>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <label className="text-xs font-bold">
                          Image {index + 1} URL
                          <input
                            aria-label={`Image ${index + 1} URL`}
                            className="input input-bordered input-sm mt-1 w-full rounded-lg"
                            maxLength={2_048}
                            onChange={(event) => setImages((current) => current.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, url: event.target.value } : item))}
                            placeholder="https://…"
                            type="url"
                            value={image.url}
                          />
                        </label>
                        <label className="text-xs font-bold">
                          Image description
                          <input
                            aria-label={`Image ${index + 1} description`}
                            className="input input-bordered input-sm mt-1 w-full rounded-lg"
                            maxLength={200}
                            onChange={(event) => setImages((current) => current.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, altText: event.target.value } : item))}
                            placeholder="Describe what this image shows"
                            value={image.altText}
                          />
                        </label>
                      </div>
                      <button
                        aria-label={`Remove image ${index + 1}`}
                        className="btn btn-ghost btn-sm btn-square text-error"
                        onClick={() => setImages((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                        type="button"
                      >
                        <Trash2 aria-hidden="true" className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <label className="block">
              <span className="mb-2 flex items-center justify-between gap-3 text-sm font-bold">
                Body <span className="font-medium text-muted-content">{content.length}/2,000</span>
              </span>
              <textarea
                className="textarea textarea-bordered min-h-36 w-full resize-y rounded-2xl"
                maxLength={2_000}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Share what happened, what changed, and what others can learn…"
                value={content}
              />
            </label>

            <section aria-labelledby="post-tags-title">
              <h3 className="flex items-center gap-2 font-extrabold" id="post-tags-title">
                <Tag aria-hidden="true" className="size-4 text-primary" />
                Tags <span className="font-medium text-muted-content">(optional)</span>
              </h3>
              <div className="mt-3 flex gap-2">
                <input
                  aria-label="Add a tag"
                  className="input input-bordered min-w-0 flex-1 rounded-xl"
                  maxLength={30}
                  onChange={(event) => setTagInput(event.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="e.g. streamcare"
                  value={tagInput}
                />
                <button className="btn btn-outline rounded-xl" disabled={!tagInput.trim() || tags.length >= MAX_TAGS} onClick={addTag} type="button">
                  Add
                </button>
              </div>
              {tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {tags.map((tagValue) => (
                    <span className="badge badge-lg gap-1 border-primary/25 bg-primary/8 text-primary" key={tagValue}>
                      #{tagValue}
                      <button
                        aria-label={`Remove tag ${tagValue}`}
                        className="rounded-full"
                        onClick={() => setTags((current) => current.filter((item) => item !== tagValue))}
                        type="button"
                      >
                        <X aria-hidden="true" className="size-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </section>

            {!isEditing && <fieldset>
              <legend className="font-extrabold">Visibility</legend>
              <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl bg-base-200 p-1.5">
                <button
                  aria-pressed={!isHidden}
                  className={`rounded-xl px-4 py-3 text-sm font-bold ${!isHidden ? 'bg-base-100 text-primary shadow-sm' : 'text-muted-content'}`}
                  onClick={() => setIsHidden(false)}
                  type="button"
                >
                  Public
                  <span className="mt-0.5 block text-xs font-normal">Everyone can discover it</span>
                </button>
                <button
                  aria-pressed={isHidden}
                  className={`rounded-xl px-4 py-3 text-sm font-bold ${isHidden ? 'bg-base-100 text-primary shadow-sm' : 'text-muted-content'}`}
                  onClick={() => setIsHidden(true)}
                  type="button"
                >
                  Only me
                  <span className="mt-0.5 block text-xs font-normal">You can make it public later</span>
                </button>
              </div>
            </fieldset>}

          </div>

          <div className="relative flex flex-col-reverse gap-2 border-t border-base-300 bg-base-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-6" data-testid="post-composer-actions">
            {errorNotice && (
              <div
                className="alert alert-error absolute inset-x-0 bottom-full z-30 rounded-2xl px-5 py-3 text-sm font-semibold shadow-2xl sm:px-6"
                role="alert"
              >
                {errorNotice}
              </div>
            )}
            <button className="btn btn-ghost" disabled={pending} onClick={closeDialog} type="button">
              Cancel
            </button>
            <button className="btn btn-primary rounded-full px-7" disabled={pending} type="submit">
              <Send aria-hidden="true" className="size-4" />
              {pending ? (isEditing ? 'Saving…' : 'Publishing…') : (isEditing ? 'Save changes' : 'Publish post')}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}

function isHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date to be confirmed';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
}
