import { Leaf } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function BrandMark() {
  return (
    <Link
      aria-label="Kiwimpact home"
      className="group inline-flex shrink-0 items-center gap-2.5"
      to="/"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-content shadow-sm transition-transform group-hover:-rotate-6">
        <Leaf aria-hidden="true" className="size-4.5" strokeWidth={2.5} />
      </span>
      <img
        alt=""
        aria-hidden="true"
        className="h-8 w-auto transition-transform duration-200 group-hover:scale-[1.02] max-[359px]:hidden sm:h-9"
        src="/branding/kiwimpact-logo.svg"
      />
    </Link>
  );
}
