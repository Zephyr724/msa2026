import { getBadgeLabelLines } from '../../lib/questHighlightBadge.ts';

interface QuestHighlightBadgeProps {
  label: string;
}

function createStarburstPoints(
  centreX: number,
  centreY: number,
  outerRadius: number,
  innerRadius: number,
  points: number,
): string {
  return Array.from({ length: points * 2 }, (_, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI) / points;
    const radius = index % 2 === 0 ? outerRadius : innerRadius;
    return `${centreX + Math.cos(angle) * radius},${centreY + Math.sin(angle) * radius}`;
  }).join(' ');
}

const sealPoints = createStarburstPoints(50, 50, 48, 42.5, 18);

export default function QuestHighlightBadge({ label }: QuestHighlightBadgeProps) {
  const labelLines = getBadgeLabelLines(label);

  return (
    <span
      aria-label={label}
      className="kiwi-quest-highlight-badge absolute left-1 top-1"
    >
      <svg
        aria-hidden="true"
        className="kiwi-quest-highlight-badge__art"
        focusable="false"
        viewBox="0 0 100 125"
      >
        <g className="kiwi-quest-highlight-badge__ribbons">
          <path className="kiwi-quest-highlight-badge__ribbon" d="M18 64 L46 73 L36 121 L24 102 L7 112 L16 66 Z" />
          <path className="kiwi-quest-highlight-badge__ribbon" d="M54 73 L82 64 L84 66 L93 112 L76 102 L64 121 Z" />
          <path className="kiwi-quest-highlight-badge__ribbon-fold" d="M18 68 L44 76 L39 88 L15 78 Z" />
          <path className="kiwi-quest-highlight-badge__ribbon-fold" d="M56 76 L82 68 L85 78 L61 88 Z" />
        </g>

        <polygon
          className="kiwi-quest-highlight-badge__seal"
          points={sealPoints}
        />
        <circle className="kiwi-quest-highlight-badge__outer-ring" cx="50" cy="50" r="40" />
        <circle
          className="kiwi-quest-highlight-badge__face"
          cx="50"
          cy="50"
          r="36.5"
        />
        <circle className="kiwi-quest-highlight-badge__inner-ring" cx="50" cy="50" r="33.5" />
      </svg>
      <span aria-hidden="true" className="kiwi-quest-highlight-badge__label">
        {labelLines.map((line, index) => (
          <span key={`${index}-${line}`}>{line}</span>
        ))}
      </span>
    </span>
  );
}
