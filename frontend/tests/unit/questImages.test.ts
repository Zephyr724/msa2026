import { describe, expect, it } from 'vitest';
import {
  buildQuestImageCandidates,
  isRepositoryQuestPlaceholder,
  QUEST_IMAGE_FALLBACK,
} from '../../src/lib/questImages.ts';

describe('quest image placeholders', () => {
  it('replaces known repository demo SVGs with a topic-specific Pexels photo', () => {
    const candidates = buildQuestImageCandidates({
      category: 'RestoreNature',
      height: 300,
      source: '/images/quests/tree-planting.svg',
      title: 'Native Tree Planting Day',
      width: 800,
    });

    expect(candidates[0]).toContain('images.pexels.com/photos/7656721/');
    expect(candidates[0]).toContain('w=800');
    expect(candidates[0]).toContain('h=300');
    expect(candidates[1]).toContain('images.unsplash.com');
    expect(candidates[2]).toBe(
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

  it('uses different topic photos for quests in the same category', () => {
    const treePlanting = buildQuestImageCandidates({
      category: 'RestoreNature',
      source: '/images/quests/tree-planting.svg',
      title: 'Native Tree Planting Day',
    });
    const wetlandPlanting = buildQuestImageCandidates({
      category: 'RestoreNature',
      source: '/images/quests/wetland-restoration.svg',
      title: 'Sanctuary Wetland Community Planting',
    });

    expect(treePlanting[0]).toContain('/7656721/');
    expect(wetlandPlanting[0]).toContain('/28662953/');
    expect(treePlanting[0]).not.toBe(wetlandPlanting[0]);
  });

  it('keeps recycling, waste auditing, and composting covers distinct', () => {
    const titles = [
      'Recycling Workshop',
      'Papakura Waste Audit',
      'Auckland Learn to Compost Workshops',
    ];
    const covers = titles.map((title) => buildQuestImageCandidates({
      category: 'CleanReduceWaste',
      source: '/images/quests/recycling-workshop.svg',
      title,
    })[0]);

    expect(new Set(covers).size).toBe(titles.length);
  });

  it('recognises all repository quest SVGs as placeholders', () => {
    expect(isRepositoryQuestPlaceholder('/images/quests/community-garden.svg')).toBe(true);
    expect(isRepositoryQuestPlaceholder(QUEST_IMAGE_FALLBACK)).toBe(true);
    expect(isRepositoryQuestPlaceholder('https://example.org/real.jpg')).toBe(false);
  });
});
