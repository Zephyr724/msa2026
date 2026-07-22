import { Leaf } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="text-center space-y-4">
        <Leaf className="mx-auto size-16 text-success" />
        <h1 className="text-4xl font-bold text-base-content">Kiwimpact</h1>
        <p className="text-lg text-base-content/70">
          Community eco quests across New Zealand
        </p>
        <p className="text-sm text-base-content/50">
          Foundation shell — business features coming soon.
        </p>
      </div>
    </div>
  );
}