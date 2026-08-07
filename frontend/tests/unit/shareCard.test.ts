import { describe, expect, it, vi } from 'vitest';
import { drawShareCard, isCurrentArtwork } from '../../src/lib/shareCard.ts';

function canvasHarness() {
  const drawnText: string[] = [];
  const drawnImages: unknown[] = [];
  const gradient = { addColorStop: vi.fn() };
  const context = new Proxy({
    createLinearGradient: vi.fn(() => gradient),
    measureText: vi.fn((value: string) => ({ width: value.length * 25 })),
    fillText: vi.fn((value: string) => drawnText.push(value)),
    drawImage: vi.fn((image: unknown) => drawnImages.push(image)),
  } as unknown as CanvasRenderingContext2D, {
    get(target, property) {
      if (property in target) return target[property as keyof typeof target];
      return vi.fn();
    },
    set(target, property, value) {
      Reflect.set(target, property, value);
      return true;
    },
  });
  const canvas = {
    width: 0,
    height: 0,
    getContext: vi.fn(() => context),
  } as unknown as HTMLCanvasElement;
  return { canvas, drawnText, drawnImages };
}

const options = {
  completion: {
    completionId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    questId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    questTitle: 'Harbour restoration day',
    questCategory: 'RestoreNature' as const,
    questStatus: 'Published' as const,
    coverImage: null,
    status: 'Verified' as const,
    method: 'CompletionCode' as const,
    completedAtUtc: '2026-07-20T09:00:00Z',
    verifiedAtUtc: '2026-07-20T09:00:00Z',
    xpAmount: 50,
    achievementNames: ['First Step'],
  },
  displayName: 'Aroha',
  overlay: 'dark' as const,
  progression: { totalXp: 120, level: 3, rankTitle: 'Novice' },
  showName: false,
  theme: 'forest' as const,
};

describe('Share Card renderer', () => {
  it('renders the authoritative completion at 1080 square without the opt-out name', () => {
    const { canvas, drawnText } = canvasHarness();
    expect(drawShareCard(canvas, options)).toBe(true);
    expect(canvas.width).toBe(1080);
    expect(canvas.height).toBe(1080);
    expect(drawnText.join(' ')).toContain('Harbour restoration day');
    expect(drawnText.join(' ')).toContain('+50 XP');
    expect(drawnText.join(' ')).not.toContain('Aroha');
  });

  it('includes the display name only after explicit opt-in', () => {
    const { canvas, drawnText } = canvasHarness();
    drawShareCard(canvas, { ...options, showName: true });
    expect(drawnText).toContain('Aroha');
  });

  it('labels a verified reward-pending completion without inventing zero XP', () => {
    const { canvas, drawnText } = canvasHarness();
    drawShareCard(canvas, {
      ...options,
      completion: { ...options.completion, xpAmount: null },
    });
    expect(drawnText.join(' ')).toContain('XP PENDING');
    expect(drawnText.join(' ')).not.toContain('+0 XP');
  });

  it('draws the current trophy artwork with its tier label', () => {
    const { canvas, drawnText, drawnImages } = canvasHarness();
    const trophyImage = {} as HTMLImageElement;
    expect(drawShareCard(canvas, {
      ...options,
      trophy: { tier: 'Gold', image: trophyImage },
    })).toBe(true);
    expect(drawnText).toContain('GOLD TROPHY');
    expect(drawnImages).toContain(trophyImage);
    expect(drawnText.join(' ')).toContain('Harbour restoration day');
  });

  it('draws the earned achievement badges relevant to the completion', () => {
    const { canvas, drawnText, drawnImages } = canvasHarness();
    const badgeImage = {} as HTMLImageElement;
    drawShareCard(canvas, {
      ...options,
      achievementBadges: [{ label: 'First Step', image: badgeImage }],
    });
    expect(drawnImages).toContain(badgeImage);
    expect(drawnText).toContain('First Step');
  });

  it('falls back to vector art when artwork images failed to load', () => {
    const { canvas, drawnText, drawnImages } = canvasHarness();
    expect(drawShareCard(canvas, {
      ...options,
      trophy: { tier: 'Gold', image: null },
      achievementBadges: [{ label: 'First Step', image: null }],
    })).toBe(true);
    expect(drawnImages).toHaveLength(0);
    expect(drawnText).toContain('GOLD TROPHY');
    expect(drawnText).toContain('First Step');
  });

  it('announces a locked trophy truthfully instead of inventing a tier', () => {
    const { canvas, drawnText } = canvasHarness();
    drawShareCard(canvas, {
      ...options,
      trophy: { tier: 'Locked', image: null },
    });
    expect(drawnText).toContain('FIRST TROPHY AWAITS');
    expect(drawnText.join(' ')).not.toContain('LOCKED TROPHY');
  });

  it('keeps the display name off the card even when artwork is drawn', () => {
    const { canvas, drawnText } = canvasHarness();
    drawShareCard(canvas, {
      ...options,
      trophy: { tier: 'Gold', image: {} as HTMLImageElement },
      achievementBadges: [{ label: 'First Step', image: null }],
    });
    expect(drawnText.join(' ')).not.toContain('Aroha');
  });
});

describe('isCurrentArtwork stale-load guard', () => {
  const artwork = {
    completionId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    tier: 'Bronze' as string | undefined,
    badgeKeys: ['FIRST-STEP|First Step'],
  };

  it('accepts artwork whose identity matches the current card', () => {
    expect(isCurrentArtwork(
      artwork,
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'Bronze',
      ['FIRST-STEP|First Step'],
    )).toBe(true);
  });

  it('rejects artwork from another completion or tier', () => {
    expect(isCurrentArtwork(artwork, 'other-completion', 'Bronze', artwork.badgeKeys))
      .toBe(false);
    expect(isCurrentArtwork(
      artwork,
      artwork.completionId,
      'Silver',
      artwork.badgeKeys,
    )).toBe(false);
  });

  it('rejects re-resolved badge identity even when the count is unchanged', () => {
    // Name-to-code resolution changed the key without changing the length.
    expect(isCurrentArtwork(
      artwork,
      artwork.completionId,
      'Bronze',
      ['verified-completions-1|First Step'],
    )).toBe(false);
    expect(isCurrentArtwork(artwork, artwork.completionId, 'Bronze', [])).toBe(false);
  });
});
