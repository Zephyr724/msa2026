import { Leaf } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BrandMarkProps {
  compact?: boolean;
}

export default function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <Link
      aria-label="Kiwimpact home"
      className="group inline-flex items-center gap-2.5"
      to="/"
    >
      <span className="grid size-9 place-items-center rounded-full bg-primary text-primary-content shadow-sm transition-transform group-hover:-rotate-6">
        <Leaf aria-hidden="true" className="size-4.5" strokeWidth={2.5} />
      </span>
      {!compact && (
        <span className="kiwi-display text-xl text-base-content">Kiwimpact</span>
      )}
    </Link>
  );
}
