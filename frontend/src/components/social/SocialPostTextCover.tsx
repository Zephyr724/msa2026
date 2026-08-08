import { Quote } from 'lucide-react';
import { useLayoutEffect, useRef } from 'react';
import { firstCompleteSentence, fitTextToContainer } from '../../lib/socialTextCover';

export default function SocialPostTextCover({
  content,
  fallback,
  detail = false,
}: {
  content: string;
  fallback: string;
  detail?: boolean;
}) {
  const textContainerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const coverText = firstCompleteSentence(content, fallback);

  useLayoutEffect(() => {
    const container = textContainerRef.current;
    const text = textRef.current;
    if (!container || !text) return;

    const fit = () => fitTextToContainer(container, text);
    fit();

    const resizeObserver = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(fit);
    resizeObserver?.observe(container);
    window.addEventListener('resize', fit);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', fit);
    };
  }, [coverText]);

  return (
    <div
      className={`relative flex overflow-hidden bg-secondary text-secondary-content ${detail ? 'aspect-[19/25] min-h-full w-full md:h-full md:aspect-auto' : 'aspect-[19/25] w-full'}`}
      data-testid="social-text-cover"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-12 opacity-[0.08]"
        data-testid="social-text-cover-watermark"
        style={{
          backgroundImage: "url('/branding/kiwimpact-leaf-watermark.svg')",
          backgroundPosition: '0 0',
          backgroundRepeat: 'repeat',
          backgroundSize: '150px 100px',
          transform: 'rotate(-18deg) scale(1.1)',
        }}
      />
      {!detail && (
        <Quote
          aria-hidden="true"
          className="absolute left-5 top-5 z-10 size-8 text-secondary-content opacity-35"
          data-testid="social-text-cover-quote"
          fill="currentColor"
        />
      )}
      <div
        className="relative flex min-h-0 w-full flex-col justify-between gap-8 p-6 sm:p-7 md:justify-center md:p-12"
        ref={textContainerRef}
      >
        {detail && <Quote aria-hidden="true" className="size-9 opacity-35 md:size-12" fill="currentColor" />}
        <p
          className="break-words text-base font-extrabold leading-relaxed md:max-w-2xl md:text-center md:text-2xl"
          ref={textRef}
        >
          {coverText}
        </p>
      </div>
    </div>
  );
}
