import { Shield, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProgression } from '../hooks/useProgression.ts';

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
      className="hidden items-center gap-2 rounded-full border border-accent/45 bg-accent/10 px-3 py-1.5 text-xs font-bold text-base-content transition-colors hover:bg-accent/20 lg:flex"
      to="/passport"
    >
      <Shield aria-hidden="true" className="size-4 text-primary" />
      <Zap aria-hidden="true" className="size-3.5 text-warning" />
      <span>{progression.data.totalXp} XP · Lv {progression.data.level}</span>
    </Link>
  );
}
