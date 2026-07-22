import { Link } from 'react-router-dom';
import { MapPinOff } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="text-center space-y-4">
        <MapPinOff className="mx-auto size-16 text-warning" />
        <h1 className="text-4xl font-bold text-base-content">404</h1>
        <p className="text-lg text-base-content/70">
          This page could not be found.
        </p>
        <Link to="/" className="btn btn-primary">
          Back to Home
        </Link>
      </div>
    </div>
  );
}