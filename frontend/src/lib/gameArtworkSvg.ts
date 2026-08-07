import type { AchievementTrophyTier } from '../types/achievement.ts';

// ── Single source of truth for trophy and achievement badge artwork ──
// React components render the inner markup directly; the Share Card
// rasterizes the standalone SVG document form into an off-canvas image.
// Both forms are generated here so the two render paths can never drift.

export const TROPHY_PALETTES: Record<
  AchievementTrophyTier,
  { dark: string; mid: string; light: string; gem: string }
> = {
  Locked: {
    dark: '#7A8C84',
    mid: '#AAB6B0',
    light: '#D8DFD9',
    gem: '#EEF2EF',
  },
  Bronze: {
    dark: '#8A4528',
    mid: '#C87040',
    light: '#F0B184',
    gem: '#FFD2B3',
  },
  Silver: {
    dark: '#64736C',
    mid: '#9DB5A4',
    light: '#E0ECE5',
    gem: '#F7FFFA',
  },
  Gold: {
    dark: '#9C6B00',
    mid: '#D4A020',
    light: '#FFE08A',
    gem: '#FFF4C2',
  },
  Platinum: {
    dark: '#55727E',
    mid: '#8FB2BE',
    light: '#D8F0F3',
    gem: '#F2FFFF',
  },
  Diamond: {
    dark: '#4654A3',
    mid: '#7B8FF0',
    light: '#C6F4FF',
    gem: '#FFFFFF',
  },
};

export function achievementBadgeAccent(code: string): string {
  return code.includes('5')
    ? '#D4A020'
    : code.includes('3')
      ? '#3C72C9'
      : '#2F8F5B';
}

/** Inner elements of the 56×56 trophy artwork for a tier. */
export function trophyInnerSvg(tier: AchievementTrophyTier): string {
  const palette = TROPHY_PALETTES[tier];
  const lit = tier !== 'Locked';
  return [
    `<path d="M16 8h24v8c0 10-5 17-12 17S16 26 16 16Z" fill="${palette.mid}"/>`,
    `<path d="M19 11h18v5c0 8-3.8 13.5-9 13.5S19 24 19 16Z" fill="${palette.light}" opacity=".72"/>`,
    `<path d="M16 12H9v5c0 7 4 11 10 11M40 12h7v5c0 7-4 11-10 11" fill="none" stroke="${palette.dark}" stroke-linecap="round" stroke-linejoin="round" stroke-width="3"/>`,
    `<path d="M25 32h6v8h-6z" fill="${palette.dark}"/>`,
    `<path d="M18 47c0-4 3-7 7-7h6c4 0 7 3 7 7Z" fill="${palette.mid}"/>`,
    `<path d="m28 12 5 6-5 7-5-7Z" fill="${lit ? palette.gem : palette.light}" stroke="${palette.dark}" stroke-width="1.2"/>`,
    tier === 'Diamond'
      ? '<path d="m28 6 3 4-3 4-3-4Z" fill="#fff" opacity=".9"/>'
      : '',
  ].join('');
}

// Repository-owned lock glyph replacing the Lucide <Lock> so the standalone
// SVG form needs no icon font or runtime. Proportions mirror the previous
// Lucide lock at x=14 y=14 size=20 inside the 48×48 viewBox.
const LOCK_GLYPH = [
  '<path d="M19.8 23.2v-3.4a4.2 4.2 0 0 1 8.4 0v3.4" fill="none" stroke="#9BA5A0" stroke-width="1.7"/>',
  '<rect x="16.5" y="23.2" width="15" height="9.2" rx="1.7" fill="none" stroke="#9BA5A0" stroke-width="1.7"/>',
].join('');

// ── Per-achievement logo glyphs (accepted D5 mapping) ──
// specs/implementation/06b-passport-achievements-ui.md §12: known codes map to
// distinct Lucide icons with Award as the stable fallback. The path data
// below mirrors the installed lucide-react (ISC) Footprints, TrendingUp,
// Medal, and Award icons on their 24×24 stroke grid, kept here as
// repository-owned constants so the React badge and the canvas/data-URL
// rasterization always render the identical glyph.
const ACHIEVEMENT_GLYPHS = {
  Footprints: [
    '<path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z"/>',
    '<path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z"/>',
    '<path d="M16 17h4"/>',
    '<path d="M4 13h4"/>',
  ].join(''),
  TrendingUp: [
    '<path d="M16 7h6v6"/>',
    '<path d="m22 7-8.5 8.5-5-5L2 17"/>',
  ].join(''),
  Medal: [
    '<path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15"/>',
    '<path d="M11 12 5.12 2.2"/>',
    '<path d="m13 12 5.88-9.8"/>',
    '<path d="M8 7h8"/>',
    '<circle cx="12" cy="17" r="5"/>',
    '<path d="M12 18v-2h-.5"/>',
  ].join(''),
  Award: [
    '<path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"/>',
    '<circle cx="12" cy="8" r="6"/>',
  ].join(''),
} as const;

export type AchievementGlyphName = keyof typeof ACHIEVEMENT_GLYPHS;

/** Accepted D5 code → logo mapping; unknown codes use the stable Award glyph. */
export function achievementGlyphForCode(code: string): AchievementGlyphName {
  switch (code) {
    case 'verified-completions-1':
      return 'Footprints';
    case 'verified-completions-3':
      return 'TrendingUp';
    case 'verified-completions-5':
      return 'Medal';
    default:
      return 'Award';
  }
}

/** White stroke glyph centred in the 48×48 badge viewBox. */
function achievementGlyphSvg(code: string): string {
  return `<g transform="translate(12 12)" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ACHIEVEMENT_GLYPHS[achievementGlyphForCode(code)]}</g>`;
}

/** Inner elements of the 48×48 hexagonal achievement badge. */
export function achievementBadgeInnerSvg(options: {
  code: string;
  unlocked: boolean;
}): string {
  const { code, unlocked } = options;
  const accent = achievementBadgeAccent(code);
  return [
    `<path d="M24 4 41 13v18L24 44 7 31V13Z" fill="${unlocked ? accent : '#CBD5CC'}"/>`,
    `<path d="m24 7 14.5 8v14L24 41 9.5 29V15Z" fill="${unlocked ? accent : '#D8DFD9'}" opacity=".55"/>`,
    unlocked
      // Distinct per-achievement logo (D5 mapping); never a shared silhouette.
      ? achievementGlyphSvg(code)
      : LOCK_GLYPH,
    `<path d="M24 4 41 13v18L24 44 7 31V13Z" fill="none" opacity=".4" stroke="${unlocked ? '#fff' : '#B0BBB5'}" stroke-width="1.2"/>`,
  ].join('');
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/** Standalone trophy SVG document, safe to rasterize via a data: URL. */
export function trophySvgString(
  tier: AchievementTrophyTier,
  size: number,
): string {
  const lit = tier !== 'Locked';
  const label = `${tier} achievement trophy${lit ? '' : ', locked'}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeXml(label)}" viewBox="0 0 56 56" width="${size}" height="${size}">${trophyInnerSvg(tier)}</svg>`;
}

/** Standalone achievement badge SVG document for canvas rasterization. */
export function achievementBadgeSvgString(options: {
  code: string;
  label: string;
  unlocked: boolean;
  size: number;
}): string {
  const label = `${options.label} badge, ${options.unlocked ? 'earned' : 'locked'}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeXml(label)}" viewBox="0 0 48 48" width="${options.size}" height="${options.size}">${achievementBadgeInnerSvg(options)}</svg>`;
}
