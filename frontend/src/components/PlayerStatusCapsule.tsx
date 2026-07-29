import { Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProgression } from '../hooks/useProgression.ts';
import { RankCrest } from './game/GameArtwork.tsx';

export default function PlayerStatusCapsule() {
  const progression = useProgression();

  if (progression.isPending) {
    return (
      <span
        aria-live="polite"
        className="skeleton hidden h-9 w-32 rounded-full lg:block"
      />
    );
  }

  if (!progression.data) return null;

  return (
    <Link
      aria-label={`${progression.data.totalXp} XP, level ${progression.data.level}, ${progression.data.rankTitle}`}
      className="hidden shrink-0 items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 transition-opacity hover:opacity-80 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300 lg:flex"
      to="/passport"
    >
      <RankCrest rankTitle={progression.data.rankTitle} size={24} />
      <Zap aria-hidden="true" className="size-3.5 text-amber-600 dark:text-amber-400" />
      <span className="whitespace-nowrap">
        {progression.data.totalXp} XP · Lv {progression.data.level}
      </span>
    </Link>
  );
}
