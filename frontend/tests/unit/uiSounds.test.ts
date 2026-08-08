import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  isSoundMuted,
  playUiSound,
  setSoundMuted,
  SOUND_MUTED_STORAGE_KEY,
} from '../../src/lib/uiSounds.ts';

describe('uiSounds', () => {
  beforeEach(() => {
    window.localStorage.clear();
    setSoundMuted(false);
    vi.restoreAllMocks();
  });

  it('defaults to unmuted', () => {
    expect(isSoundMuted()).toBe(false);
  });

  it('persists the mute preference to localStorage', () => {
    setSoundMuted(true);
    expect(isSoundMuted()).toBe(true);
    expect(window.localStorage.getItem(SOUND_MUTED_STORAGE_KEY)).toBe('true');

    setSoundMuted(false);
    expect(window.localStorage.getItem(SOUND_MUTED_STORAGE_KEY)).toBe('false');
  });

  it('plays a sound without throwing when unmuted', () => {
    const play = vi
      .spyOn(HTMLMediaElement.prototype, 'play')
      .mockReturnValue(Promise.resolve());

    expect(() => playUiSound('click')).not.toThrow();
    expect(play).toHaveBeenCalledTimes(1);
  });

  it('does not play sounds while muted', () => {
    const play = vi
      .spyOn(HTMLMediaElement.prototype, 'play')
      .mockReturnValue(Promise.resolve());

    setSoundMuted(true);
    playUiSound('achievement');

    expect(play).not.toHaveBeenCalled();
  });

  it('stays silent when playback is rejected', () => {
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockReturnValue(
      Promise.reject(new DOMException('Autoplay blocked', 'NotAllowedError')),
    );

    expect(() => playUiSound('confirm')).not.toThrow();
  });
});
