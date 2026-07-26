import { Link } from 'react-router-dom';
import { MapPinOff } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="kiwi-topography flex min-h-[calc(100vh-4rem)] items-center justify-center bg-base-200 px-4">
      <div className="kiwi-panel max-w-lg space-y-4 p-10 text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-accent/15">
          <MapPinOff className="size-8 text-warning" />
        </span>
        <h1 className="text-5xl text-base-content">404</h1>
        <p className="text-lg text-base-content/70">
          This page could not be found.
        </p>
        <Link to="/" className="btn btn-primary rounded-full">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
