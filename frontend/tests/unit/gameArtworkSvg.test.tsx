import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AchievementBadgeArt } from '../../src/components/game/GameArtwork.tsx';
import {
  achievementBadgeInnerSvg,
  achievementBadgeSvgString,
  achievementGlyphForCode,
} from '../../src/lib/gameArtworkSvg.ts';

// Distinct per-achievement logos (accepted D5 mapping in
// specs/implementation/06b-passport-achievements-ui.md §12), shared by the
// React badge and the canvas/data-URL rasterization.
describe('achievement badge glyphs', () => {
  it('maps the accepted codes to distinct glyphs with the Award fallback', () => {
    expect(achievementGlyphForCode('verified-completions-1')).toBe('Footprints');
    expect(achievementGlyphForCode('verified-completions-3')).toBe('TrendingUp');
    expect(achievementGlyphForCode('verified-completions-5')).toBe('Medal');
    expect(achievementGlyphForCode('community-spark')).toBe('Award');
    expect(achievementGlyphForCode('anything-unknown')).toBe('Award');
  });

  it('renders distinct artwork for each known code', () => {
    const footprints = achievementBadgeInnerSvg({ code: 'verified-completions-1', unlocked: true });
    const trendingUp = achievementBadgeInnerSvg({ code: 'verified-completions-3', unlocked: true });
    const medal = achievementBadgeInnerSvg({ code: 'verified-completions-5', unlocked: true });

    expect(footprints).toContain('M4 16v-2.38');
    expect(trendingUp).toContain('m22 7-8.5 8.5-5-5L2 17');
    expect(medal).toContain('M7.21 15 2.66 7.14');
    expect(new Set([footprints, trendingUp, medal]).size).toBe(3);
  });

  it('uses the stable Award glyph for unknown codes, never the shared silhouette', () => {
    const fallback = achievementBadgeInnerSvg({ code: 'mystery-code', unlocked: true });

    expect(fallback).toContain('m15.477 12.89 1.515 8.526');
    // The retired one-shape-fits-all person silhouette must not return.
    expect(fallback).not.toContain('M16 31c0-5 3-8 8-8');
  });

  it('keeps the lock glyph for locked badges regardless of code', () => {
    const locked = achievementBadgeInnerSvg({ code: 'verified-completions-1', unlocked: false });

    expect(locked).toContain('M19.8 23.2v-3.4');
    expect(locked).not.toContain('M4 16v-2.38');
  });

  it('renders the identical glyph in React and in the standalone SVG document', () => {
    const { container } = render(
      <AchievementBadgeArt code="verified-completions-1" label="First Steps" unlocked />,
    );
    const reactMarkup = container.querySelector('svg')!.innerHTML;
    const documentMarkup = achievementBadgeSvgString({
      code: 'verified-completions-1',
      label: 'First Steps',
      unlocked: true,
      size: 96,
    });

    // The standalone document embeds the shared inner markup verbatim…
    expect(documentMarkup).toContain(achievementBadgeInnerSvg({
      code: 'verified-completions-1',
      unlocked: true,
    }));
    // …and the React badge renders the same Footprints glyph (DOM serialization
    // normalizes quoting, so compare on the glyph signature).
    expect(reactMarkup).toContain('M4 16v-2.38');
    expect(reactMarkup).not.toContain('m22 7-8.5 8.5-5-5L2 17');
  });
});
