import { describe, expect, it } from 'vitest';
import {
  CATEGORY_PRESENTATION,
  DIFFICULTY_TONES,
  REGISTRATION_TONES,
  SOURCE_TONES,
  questHighlightTone,
} from '../../src/lib/questPresentation.ts';

describe('Figma quest colour presentation', () => {
  it('uses the exact category badge palettes from the Make source', () => {
    expect(CATEGORY_PRESENTATION.RestoreNature.softTone)
      .toBe('border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300');
    expect(CATEGORY_PRESENTATION.ProtectWildlife.softTone)
      .toBe('border-sky-200 bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300');
    expect(CATEGORY_PRESENTATION.CleanReduceWaste.softTone)
      .toBe('border-orange-200 bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300');
    expect(CATEGORY_PRESENTATION.GrowCompost.softTone)
      .toBe('border-lime-200 bg-lime-50 text-lime-700 dark:bg-lime-900/30 dark:text-lime-300');
    expect(CATEGORY_PRESENTATION.ObserveMeasure.softTone)
      .toBe('border-violet-200 bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300');
    expect(CATEGORY_PRESENTATION.LearnShare.softTone)
      .toBe('border-pink-200 bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300');
  });

  it('uses the Make difficulty colours in both themes', () => {
    expect(DIFFICULTY_TONES.Easy).toContain('border-emerald-200');
    expect(DIFFICULTY_TONES.Easy).toContain('dark:text-emerald-400');
    expect(DIFFICULTY_TONES.Medium).toContain('border-amber-200');
    expect(DIFFICULTY_TONES.Medium).toContain('dark:text-amber-400');
    expect(DIFFICULTY_TONES.Hard).toContain('border-red-200');
    expect(DIFFICULTY_TONES.Hard).toContain('dark:text-red-400');
  });

  it('keeps source, registration, and discovery states visually distinct', () => {
    expect(SOURCE_TONES.AdminCuratedExternal).toContain('border-purple-200');
    expect(SOURCE_TONES.PlatformEcoChallenge).toContain('border-emerald-200');
    expect(REGISTRATION_TONES.Native).toContain('border-violet-200');
    expect(REGISTRATION_TONES.NoneRequired).toContain('border-zinc-200');
    expect(questHighlightTone('Recommended for you')).toContain('border-violet-200');
    expect(questHighlightTone('Good first Quest')).toContain('border-emerald-200');
    expect(questHighlightTone('Almost full')).toContain('border-amber-200');
    expect(questHighlightTone('Claim not verified')).toContain('border-red-200');
  });
});
