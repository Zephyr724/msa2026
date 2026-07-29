import { Lock } from 'lucide-react';

const RANK_COLOURS: Record<string, { base: string; glow: string; mark: string }> = {
  Adventurer: { base: '#D4A020', glow: '#F4C840', mark: '#FFE599' },
  Novice: { base: '#5A7A65', glow: '#7A9A85', mark: '#C8DDD4' },
  Ranger: { base: '#2F8F5B', glow: '#3BA868', mark: '#A3E8C0' },
  Scout: { base: '#3C72C9', glow: '#5D93E6', mark: '#BAD4FF' },
};

export function RankCrest({
  rankTitle,
  size = 44,
}: {
  rankTitle: string;
  size?: number;
}) {
  const colours = RANK_COLOURS[rankTitle] ?? RANK_COLOURS.Novice;

  return (
    <svg
      aria-label={`${rankTitle} rank crest`}
      height={size}
      role="img"
      viewBox="0 0 44 44"
      width={size}
    >
      <path d="M22 3 37 9v15c0 8-7 14-15 17C14 38 7 32 7 24V9Z" fill={colours.base} />
      <path d="M22 5 35 10.5V24c0 7-6.5 13-13 15.5C15.5 37 9 31 9 24V10.5Z" fill={colours.glow} opacity=".45" />
      {rankTitle === 'Novice' ? (
        <>
          <path d="M22 13s-4 4-4 8c0 3 2 6 4 6s4-3 4-6c0-4-4-8-4-8Z" fill="#9DB5A4" />
          <path d="M22 14v12M19 20h6" stroke={colours.mark} strokeWidth="1.5" strokeLinecap="round" />
        </>
      ) : rankTitle === 'Adventurer' ? (
        <>
          <path d="m13 28 9-16 9 16Z" fill="#FFD166" opacity=".55" />
          <path d="m15 28 7-14 7 14Z" fill={colours.mark} />
          <path d="M13 28h18" stroke={colours.base} strokeWidth="2" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="22" cy="21" r="7.5" fill={colours.mark} opacity=".35" />
          <path d="m22 13 2.2 5 5.3.5-4 3.5 1.3 5.2-4.8-2.7-4.8 2.7 1.3-5.2-4-3.5 5.3-.5Z" fill={colours.mark} />
        </>
      )}
    </svg>
  );
}

export function MedalArtwork({
  position,
  size = 44,
}: {
  position: 1 | 2 | 3;
  size?: number;
}) {
  const palette = {
    1: { inner: '#FFE08A', middle: '#F4B740', outer: '#D4A020', text: '#7A5800' },
    2: { inner: '#C5D8CC', middle: '#9DB5A4', outer: '#7A8C84', text: '#3A5040' },
    3: { inner: '#E8A87A', middle: '#C87040', outer: '#A04020', text: '#5A2810' },
  }[position];

  return (
    <svg
      aria-label={`Number ${position} medal`}
      height={size * 1.14}
      role="img"
      viewBox="0 0 44 50"
      width={size}
    >
      <path d="m16 4 6 8 6-8Z" fill={palette.middle} opacity=".85" />
      <circle cx="22" cy="33" r="16" fill={palette.outer} />
      <circle cx="22" cy="33" r="13.5" fill={palette.middle} />
      <circle cx="22" cy="33" r="11" fill={palette.inner} />
      <text x="22" y="38.5" textAnchor="middle" fontSize="13" fontWeight="700" fill={palette.text} fontFamily="Fredoka, system-ui, sans-serif">
        {position}
      </text>
    </svg>
  );
}

export function AchievementBadgeArt({
  code,
  label,
  unlocked,
  size = 52,
}: {
  code: string;
  label: string;
  unlocked: boolean;
  size?: number;
}) {
  const accent = code.includes('5')
    ? '#D4A020'
    : code.includes('3')
      ? '#3C72C9'
      : '#2F8F5B';

  return (
    <svg
      aria-label={`${label} badge, ${unlocked ? 'earned' : 'locked'}`}
      height={size}
      role="img"
      viewBox="0 0 48 48"
      width={size}
    >
      <path d="M24 4 41 13v18L24 44 7 31V13Z" fill={unlocked ? accent : '#CBD5CC'} />
      <path d="m24 7 14.5 8v14L24 41 9.5 29V15Z" fill={unlocked ? accent : '#D8DFD9'} opacity=".55" />
      {unlocked ? (
        <>
          <circle cx="24" cy="20" r="4" fill="#fff" opacity=".92" />
          <path d="M16 31c0-5 3-8 8-8s8 3 8 8" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
        </>
      ) : (
        <Lock x="14" y="14" size={20} color="#9BA5A0" aria-hidden="true" />
      )}
      <path
        d="M24 4 41 13v18L24 44 7 31V13Z"
        fill="none"
        opacity=".4"
        stroke={unlocked ? '#fff' : '#B0BBB5'}
        strokeWidth="1.2"
      />
    </svg>
  );
}
