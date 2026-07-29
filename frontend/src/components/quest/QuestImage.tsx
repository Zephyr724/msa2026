import {
  useEffect,
  useMemo,
  useState,
  type ImgHTMLAttributes,
} from 'react';
import {
  buildQuestImageCandidates,
} from '../../lib/questImages.ts';
import type { QuestCategory } from '../../types/quest.ts';

interface QuestImageProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'alt' | 'height' | 'src' | 'width'> {
  alt?: string;
  category: QuestCategory;
  height?: number;
  source?: string | null;
  title: string;
  width?: number;
}

export default function QuestImage({
  alt,
  category,
  height = 440,
  onError,
  source,
  title,
  width = 800,
  ...imageProps
}: QuestImageProps) {
  const candidates = useMemo(
    () => buildQuestImageCandidates({
      category,
      height,
      source,
      title,
      width,
    }),
    [category, height, source, title, width],
  );
  const [candidateIndex, setCandidateIndex] = useState(0);

  useEffect(() => {
    setCandidateIndex(0);
  }, [candidates]);

  return (
    <img
      {...imageProps}
      alt={alt ?? `Environmental placeholder for ${title}`}
      height={height}
      onError={(event) => {
        onError?.(event);
        setCandidateIndex((current) =>
          Math.min(current + 1, candidates.length - 1));
      }}
      src={candidates[candidateIndex]}
      width={width}
    />
  );
}
