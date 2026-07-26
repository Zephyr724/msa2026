import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useThemeSync } from '../../src/hooks/useThemeSync.ts';
import { SYSTEM_THEME_QUERY } from '../../src/lib/theme.ts';
import { useUiStore } from '../../src/stores/useUiStore.ts';

function ThemeSyncHarness() {
  useThemeSync();
  return null;
}

function installMatchMedia(initialMatches: boolean) {
  let matches = initialMatches;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const addEventListener = vi.fn(
    (_type: string, listener: EventListenerOrEventListenerObject) => {
      listeners.add(listener as (event: MediaQueryListEvent) => void);
    },
  );
  const removeEventListener = vi.fn(
    (_type: string, listener: EventListenerOrEventListenerObject) => {
      listeners.delete(listener as (event: MediaQueryListEvent) => void);
    },
  );
  const mediaQuery = {
    get matches() {
      return matches;
    },
    media: SYSTEM_THEME_QUERY,
    onchange: null,
    addEventListener,
    removeEventListener,
  } as unknown as MediaQueryList;
  const matchMedia = vi.fn(() => mediaQuery);
  vi.stubGlobal('matchMedia', matchMedia);

  return {
    addEventListener,
    matchMedia,
    removeEventListener,
    setMatches(nextMatches: boolean) {
      matches = nextMatches;
      const event = { matches, media: SYSTEM_THEME_QUERY } as MediaQueryListEvent;
      for (const listener of listeners) {
        listener(event);
      }
    },
  };
}

describe('useThemeSync', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
    useUiStore.setState({ mobileNavOpen: false, themePreference: 'system' });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    useUiStore.setState({ mobileNavOpen: false, themePreference: 'system' });
  });

  it('applies explicit themes without consulting or subscribing to matchMedia', () => {
    const controller = installMatchMedia(true);
    useUiStore.setState({ themePreference: 'dark' });

    render(<ThemeSyncHarness />);

    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(controller.matchMedia).not.toHaveBeenCalled();
    expect(controller.addEventListener).not.toHaveBeenCalled();
  });

  it('tracks system changes live and cleans up on unmount', () => {
    const controller = installMatchMedia(false);
    const view = render(<ThemeSyncHarness />);

    expect(controller.matchMedia).toHaveBeenCalledWith(SYSTEM_THEME_QUERY);
    expect(controller.addEventListener).toHaveBeenCalledOnce();
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');

    act(() => controller.setMatches(true));
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');

    view.unmount();
    expect(controller.removeEventListener).toHaveBeenCalledOnce();
  });

  it('removes and restores the system listener as preference ownership changes', () => {
    const controller = installMatchMedia(true);
    const view = render(<ThemeSyncHarness />);
    expect(controller.addEventListener).toHaveBeenCalledOnce();

    act(() => useUiStore.getState().setThemePreference('light'));
    expect(controller.removeEventListener).toHaveBeenCalledOnce();
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');

    act(() => controller.setMatches(false));
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');

    act(() => useUiStore.getState().setThemePreference('system'));
    expect(controller.addEventListener).toHaveBeenCalledTimes(2);

    view.unmount();
    expect(controller.removeEventListener).toHaveBeenCalledTimes(2);
  });

  it('falls back to light when matchMedia is unavailable', () => {
    vi.stubGlobal('matchMedia', undefined);

    render(<ThemeSyncHarness />);

    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
  });
});
