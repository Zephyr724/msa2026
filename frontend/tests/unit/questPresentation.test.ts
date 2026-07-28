import { describe, expect, it } from 'vitest';
import { questDiscoveryHighlight } from '../../src/lib/questPresentation.ts';

describe('questDiscoveryHighlight', () => {
  it('derives labels from Quest attributes rather than result position', () => {
    const quests = [
      { difficulty: 'Medium' as const, sourceType: 'OrganizerOwned' as const },
      { difficulty: 'Hard' as const, sourceType: 'PlatformEcoChallenge' as const },
      { difficulty: 'Easy' as const, sourceType: 'OrganizerOwned' as const },
    ];

    expect(quests.map(questDiscoveryHighlight)).toEqual([
      undefined,
      'Featured challenge',
      'Good first Quest',
    ]);
    expect([...quests].reverse().map(questDiscoveryHighlight)).toEqual([
      'Good first Quest',
      'Featured challenge',
      undefined,
    ]);
  });
});
