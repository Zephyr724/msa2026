import { describe, expect, it } from 'vitest';
import {
  buildQuestImageCandidates,
  isRepositoryQuestPlaceholder,
  QUEST_IMAGE_FALLBACK,
} from '../../src/lib/questImages.ts';

describe('quest image placeholders', () => {
  it('replaces repository demo SVGs with a category photo and stable Picsum fallback', () => {
    const candidates = buildQuestImageCandidates({
      category: 'RestoreNature',
      height: 300,
      source: '/images/quests/tree-planting.svg',
      title: 'Native Tree Planting Day',
      width: 800,
    });

    expect(candidates[0]).toContain('images.unsplash.com');
    expect(candidates[0]).toContain('w=800');
    expect(candidates[0]).toContain('h=300');
    expect(candidates[1]).toBe(
      'https://picsum.photos/seed/restorenature-native-tree-planting-day/800/300',
    );
    expect(candidates.at(-1)).toBe(QUEST_IMAGE_FALLBACK);
  });

  it('preserves a real uploaded image before placeholder candidates', () => {
    const candidates = buildQuestImageCandidates({
      category: 'LearnShare',
      source: 'https://example.org/quest-photo.jpg',
      title: 'Share a Waste-Free Habit',
    });

    expect(candidates[0]).toBe('https://example.org/quest-photo.jpg');
    expect(candidates[1]).toContain('images.unsplash.com');
  });

  it('recognises all repository quest SVGs as placeholders', () => {
    expect(isRepositoryQuestPlaceholder('/images/quests/community-garden.svg')).toBe(true);
    expect(isRepositoryQuestPlaceholder(QUEST_IMAGE_FALLBACK)).toBe(true);
    expect(isRepositoryQuestPlaceholder('https://example.org/real.jpg')).toBe(false);
  });
});
