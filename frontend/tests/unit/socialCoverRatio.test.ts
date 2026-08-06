import { describe, expect, it } from 'vitest';
import { getSocialCoverCrop } from '../../src/lib/socialCoverRatio';

describe('getSocialCoverCrop', () => {
  it.each([
    [800, 1000],
    [1000, 1000],
    [1250, 1000],
    [760, 1000],
    [4000, 3000],
  ])('preserves complete near-square and boundary images (%d × %d)', (width, height) => {
    expect(getSocialCoverCrop(width, height)).toBeNull();
  });

  it('crops only ratios outside the accepted range', () => {
    expect(getSocialCoverCrop(759, 1000)).toBe('tall');
    expect(getSocialCoverCrop(1600, 900)).toBe('wide');
  });
});
