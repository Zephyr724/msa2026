import { useId } from 'react';

const SEAL_POINTS = Array.from({ length: 48 }, (_, index) => {
  const angle = -Math.PI / 2 + (index * Math.PI * 2) / 48;
  const radius = index % 2 === 0 ? 54 : 51;
  const x = 70 + Math.cos(angle) * radius;
  const y = 60 + Math.sin(angle) * radius;
  return `${x.toFixed(2)},${y.toFixed(2)}`;
}).join(' ');

export default function MissionCompletedStamp({
  className = '',
}: {
  className?: string;
}) {
  const cutoutId = `mission-complete-cutout-${useId().replaceAll(':', '')}`;

  return (
    <svg
      aria-label="Mission complete, verified"
      className={className}
      role="img"
      viewBox="0 0 140 120"
    >
      <defs>
        <mask
          data-stamp-mask="transparent-field"
          id={cutoutId}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="140"
          height="120"
        >
          <rect width="140" height="120" fill="white" />
          <circle cx="70" cy="60" fill="black" r="44" />
        </mask>
      </defs>
      <polygon
        data-stamp-seal="edge"
        fill="currentColor"
        mask={`url(#${cutoutId})`}
        points={SEAL_POINTS}
      />
      <circle
        cx="70"
        cy="60"
        data-stamp-field="transparent"
        fill="none"
        r="40"
        stroke="currentColor"
        strokeWidth="1.5"
      />

      <g aria-hidden="true" fill="currentColor">
        <path d="m49 31 2 4 4.4.6-3.2 3.1.8 4.4-4-2.1-4 2.1.8-4.4-3.2-3.1 4.4-.6Z" />
        <path d="m70 26 2.8 5.7 6.3.9-4.6 4.4 1.1 6.3-5.6-3-5.6 3 1.1-6.3-4.6-4.4 6.3-.9Z" />
        <path d="m91 31 2 4 4.4.6-3.2 3.1.8 4.4-4-2.1-4 2.1.8-4.4-3.2-3.1 4.4-.6Z" />
        <path d="m49 79 2 4 4.4.6-3.2 3.1.8 4.4-4-2.1-4 2.1.8-4.4-3.2-3.1 4.4-.6Z" />
        <path d="m70 76 2.8 5.7 6.3.9-4.6 4.4 1.1 6.3-5.6-3-5.6 3 1.1-6.3-4.6-4.4 6.3-.9Z" />
        <path d="m91 79 2 4 4.4.6-3.2 3.1.8 4.4-4-2.1-4 2.1.8-4.4-3.2-3.1 4.4-.6Z" />
      </g>

      <g transform="rotate(-8 70 60)">
        <rect
          data-stamp-band="mission-complete"
          fill="currentColor"
          height="36"
          rx="6"
          width="134"
          x="3"
          y="42"
        />
        <text
          data-stamp-line="mission-complete"
          fill="white"
          fontFamily="Arial Narrow, Impact, system-ui, sans-serif"
          fontSize="18"
          fontWeight="900"
          lengthAdjust="spacingAndGlyphs"
          textAnchor="middle"
          textLength="122"
          x="70"
          y="67"
        >
          MISSION COMPLETE
        </text>
      </g>
    </svg>
  );
}
