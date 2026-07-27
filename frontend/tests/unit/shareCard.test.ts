import { describe, expect, it, vi } from 'vitest';
import { drawShareCard } from '../../src/lib/shareCard.ts';

function canvasHarness() {
  const drawnText: string[] = [];
  const gradient = { addColorStop: vi.fn() };
  const context = new Proxy({
    createLinearGradient: vi.fn(() => gradient),
    measureText: vi.fn((value: string) => ({ width: value.length * 25 })),
    fillText: vi.fn((value: string) => drawnText.push(value)),
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
  return { canvas, drawnText };
}

const options = {
  completion: {
    completionId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    questId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    questTitle: 'Harbour restoration day',
    questCategory: 'RestoreNature' as const,
    questStatus: 'Published' as const,
    status: 'Verified' as const,
    method: 'CompletionCode' as const,
    completedAtUtc: '2026-07-20T09:00:00Z',
    verifiedAtUtc: '2026-07-20T09:00:00Z',
    xpAmount: 50,
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
});
