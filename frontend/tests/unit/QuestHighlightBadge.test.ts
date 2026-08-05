import { describe, expect, it } from 'vitest';
import {
  getBadgeLabelLines,
  splitBadgeLabel,
} from '../../src/lib/questHighlightBadge.ts';

describe('QuestHighlightBadge label layout', () => {
  it('balances longer labels for the compact badge fallback', () => {
    expect(splitBadgeLabel('Featured challenge')).toEqual(['Featured', 'challenge']);
    expect(splitBadgeLabel('Good first Quest')).toEqual(['Good first', 'Quest']);
    expect(splitBadgeLabel('Almost full · 0 left')).toEqual(['Almost full', '0 left']);
  });

  it('uses three centred lines for compact three-part labels', () => {
    expect(getBadgeLabelLines('Featured challenge')).toEqual(['Featured', 'challenge']);
    expect(getBadgeLabelLines('Good first Quest')).toEqual(['Good', 'first', 'Quest']);
    expect(getBadgeLabelLines('Almost full · 0 left')).toEqual(['Almost', 'full', '0 left']);
  });
});
