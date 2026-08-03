import { ImagePlus, Send } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { useCreateSocialPost } from '../../hooks/useSocialFeed';
import { ApiError } from '../../lib/api/apiFetch';

export default function SocialPostComposer() {
  const createPost = useCreateSocialPost();
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageAltText, setImageAltText] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [published, setPublished] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError(null);
    setPublished(false);
    const normalizedContent = content.trim();
    const normalizedImageUrl = imageUrl.trim();
    const normalizedAltText = imageAltText.trim();

    if (!normalizedContent) {
      setValidationError('Write something about your local action.');
      return;
    }
    if (normalizedContent.length > 2_000) {
      setValidationError('Post content must be 2,000 characters or fewer.');
      return;
    }
    if (normalizedImageUrl) {
      try {
        const url = new URL(normalizedImageUrl);
        if (url.protocol !== 'https:' || url.username || url.password) throw new Error();
      } catch {
        setValidationError('Image URL must be a public HTTPS address.');
        return;
      }
      if (!normalizedAltText) {
        setValidationError('Describe the image for people using assistive technology.');
        return;
      }
    } else if (normalizedAltText) {
      setValidationError('Add an image URL or remove its description.');
      return;
    }
    if (normalizedAltText.length > 200) {
      setValidationError('Image description must be 200 characters or fewer.');
      return;
    }

    try {
      await createPost.mutateAsync({
        content: normalizedContent,
        imageUrl: normalizedImageUrl || null,
        imageAltText: normalizedAltText || null,
      });
      setContent('');
      setImageUrl('');
      setImageAltText('');
      setPublished(true);
    } catch {
      // A bounded message is rendered below; server details stay contained.
    }
  }

  const serverError = createPost.error instanceof ApiError && createPost.error.status === 429
    ? 'You are publishing quickly. Wait a moment and try again.'
    : createPost.isError
      ? 'Your post could not be published. Please try again.'
      : null;

  return (
    <section className="kiwi-panel overflow-hidden" aria-labelledby="publish-post-title">
      <div className="border-b border-base-300 bg-primary/8 px-5 py-4 sm:px-6">
        <p className="kiwi-stat-label">Share local progress</p>
        <h2 className="mt-1 text-2xl" id="publish-post-title">Publish a post</h2>
      </div>
      <form className="space-y-4 p-5 sm:p-6" noValidate onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-2 flex items-center justify-between gap-3 text-sm font-bold">
            What happened?
            <span className="font-medium text-muted-content">{content.length}/2,000</span>
          </span>
          <textarea
            aria-describedby="post-content-help"
            aria-label="What happened?"
            className="textarea textarea-bordered min-h-28 w-full resize-y rounded-2xl"
            maxLength={2_000}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Tell the community about an eco action, a useful idea, or progress worth celebrating…"
            value={content}
          />
          <span className="mt-1 block text-xs text-muted-content" id="post-content-help">
            Be specific, constructive, and avoid sharing private addresses or contact details.
          </span>
        </label>

        <details className="rounded-2xl border border-base-300 bg-base-200/60 p-4">
          <summary className="flex cursor-pointer list-none items-center gap-2 font-bold">
            <ImagePlus aria-hidden="true" className="size-4 text-primary" />
            Add an image by URL <span className="font-medium text-muted-content">(optional)</span>
          </summary>
          <div className="mt-4 grid gap-4">
            <label className="block text-sm font-bold">
              HTTPS image URL
              <input
                className="input input-bordered mt-2 w-full rounded-xl"
                maxLength={2_048}
                onChange={(event) => setImageUrl(event.target.value)}
                placeholder="https://…"
                type="url"
                value={imageUrl}
              />
            </label>
            <label className="block text-sm font-bold">
              Image description
              <input
                className="input input-bordered mt-2 w-full rounded-xl"
                disabled={!imageUrl.trim()}
                maxLength={200}
                onChange={(event) => setImageAltText(event.target.value)}
                placeholder="Describe what the image shows"
                value={imageAltText}
              />
            </label>
            <p className="text-xs text-muted-content">
              Kiwimpact links to the image; it does not upload or moderate the file.
            </p>
          </div>
        </details>

        {(validationError || serverError) && (
          <div className="alert alert-error rounded-2xl" role="alert">
            {validationError ?? serverError}
          </div>
        )}
        {published && (
          <div className="alert alert-success rounded-2xl" role="status">
            Your post is now in the community feed.
          </div>
        )}

        <div className="flex justify-end">
          <button
            className="btn btn-primary rounded-full px-6"
            disabled={createPost.isPending}
            type="submit"
          >
            <Send aria-hidden="true" className="size-4" />
            {createPost.isPending ? 'Publishing…' : 'Publish'}
          </button>
        </div>
      </form>
    </section>
  );
}
