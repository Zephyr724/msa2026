import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState, type UIEvent } from 'react';
import type { SocialPostImageDto } from '../../types/social';

export default function SocialPostImageCarousel({ images, detail = false }: { images: SocialPostImageDto[]; detail?: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) return null;

  function goTo(index: number) {
    const nextIndex = Math.max(0, Math.min(images.length - 1, index));
    setActiveIndex(nextIndex);
    const track = trackRef.current;
    if (!track) return;
    const left = track.clientWidth * nextIndex;
    if (typeof track.scrollTo === 'function') track.scrollTo({ left, behavior: 'smooth' });
    else track.scrollLeft = left;
  }

  function handleScroll(event: UIEvent<HTMLDivElement>) {
    const track = event.currentTarget;
    if (track.clientWidth === 0) return;
    const nextIndex = Math.round(track.scrollLeft / track.clientWidth);
    setActiveIndex(Math.max(0, Math.min(images.length - 1, nextIndex)));
  }

  return (
    <div
      aria-label={`${images.length} post images`}
      aria-roledescription="carousel"
      className={`group relative overflow-hidden bg-base-200 ${detail ? 'h-full' : ''}`}
      role="region"
    >
      <div
        aria-label="Image slides"
        className={`flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${detail ? 'aspect-[4/5] md:h-full md:aspect-auto' : 'aspect-[4/5]'}`}
        onScroll={handleScroll}
        ref={trackRef}
        role="group"
        tabIndex={0}
      >
        {images.map((image) => (
          <img
            alt={image.imageAltText}
            className="h-full min-w-full snap-center object-cover"
            key={`${image.sortOrder}-${image.imageUrl}`}
            loading="lazy"
            referrerPolicy="no-referrer"
            src={image.imageUrl}
          />
        ))}
      </div>

      {images.length > 1 && (
        <>
          <span
            aria-atomic="true"
            aria-live="polite"
            className="absolute right-3 top-3 rounded-full bg-black/65 px-2.5 py-1 text-xs font-bold text-white"
          >
            {activeIndex + 1} / {images.length}
          </span>
          <button
            aria-label="Previous image"
            className="btn btn-circle btn-sm absolute left-2 top-1/2 -translate-y-1/2 border-white/35 bg-black/55 text-white opacity-90 hover:bg-black/75 disabled:invisible sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
            disabled={activeIndex === 0}
            onClick={() => goTo(activeIndex - 1)}
            type="button"
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
          </button>
          <button
            aria-label="Next image"
            className="btn btn-circle btn-sm absolute right-2 top-1/2 -translate-y-1/2 border-white/35 bg-black/55 text-white opacity-90 hover:bg-black/75 disabled:invisible sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
            disabled={activeIndex === images.length - 1}
            onClick={() => goTo(activeIndex + 1)}
            type="button"
          >
            <ChevronRight aria-hidden="true" className="size-4" />
          </button>
          <div
            aria-label="Choose image"
            className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5"
            role="group"
          >
            {images.map((image, index) => (
              <button
                aria-label={`Show image ${index + 1}`}
                aria-pressed={activeIndex === index}
                className={`size-2 rounded-full ring-1 ring-black/25 ${activeIndex === index ? 'bg-white' : 'bg-white/55'}`}
                key={`${image.sortOrder}-dot`}
                onClick={() => goTo(index)}
                type="button"
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
