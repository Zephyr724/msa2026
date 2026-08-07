import { describe, expect, it, vi } from 'vitest';
import {
  drawPassportShareCard,
  isCurrentPassportArtwork,
} from '../../src/lib/passportShareCard.ts';

function canvasHarness() {
  const drawnText: string[] = [];
  const drawnImages: unknown[] = [];
  const gradient = { addColorStop: vi.fn() };
  const context = new Proxy({
    createLinearGradient: vi.fn(() => gradient),
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
  return { canvas, drawnImages, drawnText };
}

const options = {
  achievements: [
    { label: 'First Steps', image: {} as HTMLImageElement, rarity: 'Common' },
    { label: 'Building Momentum', image: {} as HTMLImageElement, rarity: 'Rare' },
  ],
  displayName: 'Test Member 1',
  overlay: 'dark' as const,
  passport: {
    displayName: 'Test Member 1',
    totalXp: 200,
    level: 4,
    rankTitle: 'Novice',
    homeCommunity: { id: 'private', name: 'Auckland Central', type: 'LocalArea' as const, parentRegionId: null },
    verifiedCompletionCount: 3,
    selfReportedCompletionCount: 1,
    pendingCompletionCount: 0,
    categoryImpact: [{ questCategory: 'RestoreNature' }].map(() => ({
      category: 'RestoreNature' as const,
      verifiedCompletionCount: 3,
      verifiedXp: 200,
    })),
  },
  progression: { totalXp: 200, level: 4, rankTitle: 'Novice' },
  showName: false,
  theme: 'forest' as const,
  trophy: { tier: 'Locked' as const, image: {} as HTMLImageElement, rarity: 'Unawarded' },
};

describe('whole Passport share renderer', () => {
  it('renders the complete safe summary, trophy, and every earned achievement', () => {
    const { canvas, drawnImages, drawnText } = canvasHarness();
    expect(drawPassportShareCard(canvas, options)).toBe(true);
    expect(canvas.width).toBe(1080);
    expect(canvas.height).toBe(1080);
    expect(drawnText).toContain('MY IMPACT PASSPORT');
    expect(drawnText).toContain('FIRST TROPHY');
    expect(drawnText).toContain('AWAITS');
    expect(drawnText).toContain('First Steps');
    expect(drawnText).toContain('Common');
    expect(drawnText).toContain('Building Momentum');
    expect(drawnText).toContain('Rare');
    expect(drawnText).not.toContain('First Steps · Common');
    expect(drawnImages).toHaveLength(3);
    expect(drawnText.join(' ')).not.toContain('Auckland Central');
    expect(drawnText.join(' ')).not.toContain('Test Member 1');
  });

  it('includes the display name only after opt-in', () => {
    const { canvas, drawnText } = canvasHarness();
    drawPassportShareCard(canvas, { ...options, showName: true });
    expect(drawnText).toContain('Test Member 1');
  });
});

describe('whole Passport artwork identity', () => {
  const artwork = {
    tier: 'Bronze' as const,
    badgeKeys: ['verified-completions-1|First Steps'],
  };

  it('rejects stale trophy or badge artwork', () => {
    expect(isCurrentPassportArtwork(artwork, 'Bronze', artwork.badgeKeys)).toBe(true);
    expect(isCurrentPassportArtwork(artwork, 'Silver', artwork.badgeKeys)).toBe(false);
    expect(isCurrentPassportArtwork(artwork, 'Bronze', ['other|Other'])).toBe(false);
  });
});
