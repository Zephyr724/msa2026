import type { QuestCategory } from '../../types/quest.ts';

const EMBLEM_LABELS: Record<QuestCategory, string> = {
  CleanReduceWaste: 'Clean & Reduce Waste',
  GrowCompost: 'Grow & Compost',
  LearnShare: 'Learn & Share',
  ObserveMeasure: 'Observe & Measure',
  ProtectWildlife: 'Protect Wildlife',
  RestoreNature: 'Restore Nature',
};

export default function CategoryEmblem({
  category,
  size = 'md',
}: {
  category: QuestCategory;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}) {
  const pixels = { xs: 20, sm: 32, md: 44, lg: 56 }[size];
  const label = `${EMBLEM_LABELS[category]} emblem`;
  const common = {
    'aria-label': label,
    height: pixels,
    role: 'img' as const,
    viewBox: '0 0 44 44',
    width: pixels,
  };

  switch (category) {
    case 'ProtectWildlife':
      return (
        <svg {...common}>
          <rect x="2" y="2" width="40" height="40" rx="12" fill="#3C72C9" />
          <rect x="5" y="5" width="34" height="34" rx="9" fill="#4D84DB" opacity=".55" />
          <path d="M8 24c4-6 9-4 14-2 5-2 10-4 14 2" stroke="#BAD4FF" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M8 24c2-7 8-11 14-7 6-4 12 0 14 7" fill="#8DB7FF" opacity=".65" />
          <circle cx="22" cy="18" r="3.5" fill="#fff" opacity=".9" />
          <circle cx="22" cy="18" r="1.8" fill="#3C72C9" />
        </svg>
      );
    case 'CleanReduceWaste':
      return (
        <svg {...common}>
          <rect x="2" y="2" width="40" height="40" rx="12" fill="#C74444" />
          <rect x="5" y="5" width="34" height="34" rx="9" fill="#D95555" opacity=".55" />
          <path d="m22 10 4.5 8h-9Z" fill="#FFB4A0" />
          <path d="m30 17 4 5-4 5M14 27l-4-5 4-5" stroke="#FFB4A0" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="m22 34-4.5-8h9Z" fill="#FFB4A0" />
          <circle cx="22" cy="22" r="4" fill="#FF8B8B" opacity=".7" />
          <circle cx="22" cy="22" r="2" fill="#fff" opacity=".9" />
        </svg>
      );
    case 'GrowCompost':
      return (
        <svg {...common}>
          <rect x="2" y="2" width="40" height="40" rx="12" fill="#6C8F2F" />
          <rect x="5" y="5" width="34" height="34" rx="9" fill="#7DA337" opacity=".55" />
          <rect x="20" y="24" width="4" height="10" rx="2" fill="#C8E89A" />
          <path d="M22 24c0-5-9-9-11-13 3 0 9 4 11 8" fill="#9ED45A" />
          <path d="M22 24c0-5 9-9 11-13-3 0-9 4-11 8" fill="#BCEC82" />
          <path d="M22 21c0-3-4-7 0-9 4 2 0 6 0 9Z" fill="#E0F5B0" />
          <ellipse cx="22" cy="34" rx="9" ry="3" fill="#4A6020" opacity=".55" />
        </svg>
      );
    case 'ObserveMeasure':
      return (
        <svg {...common}>
          <rect x="2" y="2" width="40" height="40" rx="12" fill="#6C63D9" />
          <rect x="5" y="5" width="34" height="34" rx="9" fill="#7D75E5" opacity=".55" />
          <ellipse cx="22" cy="22" rx="12" ry="8" fill="#AAA1F5" opacity=".4" />
          <ellipse cx="22" cy="22" rx="12" ry="8" stroke="#C8C3FF" strokeWidth="2" fill="none" />
          <circle cx="22" cy="22" r="5.5" fill="#9490FF" />
          <circle cx="22" cy="22" r="3.5" fill="#fff" opacity=".95" />
          <circle cx="22" cy="22" r="2" fill="#6C63D9" />
          <circle cx="23.5" cy="20.5" r=".9" fill="#fff" />
        </svg>
      );
    case 'LearnShare':
      return (
        <svg {...common}>
          <rect x="2" y="2" width="40" height="40" rx="12" fill="#C963D9" />
          <rect x="5" y="5" width="34" height="34" rx="9" fill="#D974E6" opacity=".55" />
          <rect x="10" y="14" width="10" height="16" rx="2.5" fill="#F5C8FF" />
          <rect x="24" y="14" width="10" height="16" rx="2.5" fill="#EAA3FF" />
          <rect x="20" y="13" width="4" height="18" rx="1.5" fill="#fff" opacity=".75" />
          <path d="M12 18h6M12 21h6M12 24h4M26 18h6M26 21h6" stroke="#C963D9" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'RestoreNature':
    default:
      return (
        <svg {...common}>
          <rect x="2" y="2" width="40" height="40" rx="12" fill="#2F8F5B" />
          <rect x="5" y="5" width="34" height="34" rx="9" fill="#38A868" opacity=".55" />
          <path d="M22 9s10 5 10 14c0 7-5 12-10 12s-10-5-10-12c0-9 10-14 10-14Z" fill="#A3E8C0" />
          <path d="M22 12s7 4 7 11c0 6-3 10-7 10s-7-4-7-10c0-7 7-11 7-11Z" fill="#6FD69A" />
          <path d="M22 13v20M22 21l5-4M22 26l-5-4" stroke="#2F8F5B" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
  }
}
