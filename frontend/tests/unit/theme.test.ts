import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  applyTheme,
  isThemePreference,
  readStoredThemePreference,
  resolveTheme,
  THEME_STORAGE_KEY,
  writeStoredThemePreference,
} from '../../src/lib/theme.ts';
import { useUiStore } from '../../src/stores/useUiStore.ts';

describe('theme helpers and UI store persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
    useUiStore.setState({ mobileNavOpen: false, themePreference: 'system' });
  });

  it.each([
    ['light', false, 'light'],
    ['light', true, 'light'],
    ['dark', false, 'dark'],
    ['dark', true, 'dark'],
    ['system', false, 'light'],
    ['system', true, 'dark'],
  ] as const)(
    'resolves %s with system dark=%s to %s',
    (preference, systemPrefersDark, expected) => {
      expect(resolveTheme(preference, systemPrefersDark)).toBe(expected);
    },
  );

  it('accepts only the three theme preference literals', () => {
    expect(isThemePreference('light')).toBe(true);
    expect(isThemePreference('dark')).toBe(true);
    expect(isThemePreference('system')).toBe(true);
    expect(isThemePreference('sepia')).toBe(false);
    expect(isThemePreference('')).toBe(false);
    expect(isThemePreference(null)).toBe(false);
  });

  it.each(['light', 'dark', 'system'] as const)(
    'round-trips the %s preference as a bare storage value',
    (preference) => {
      const getStorage = () => localStorage;
      writeStoredThemePreference(preference, getStorage);

      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe(preference);
      expect(readStoredThemePreference(getStorage)).toBe(preference);
    },
  );

  it('falls back to system for missing and invalid stored values', () => {
    const getStorage = () => localStorage;
    expect(readStoredThemePreference(getStorage)).toBe('system');

    localStorage.setItem(THEME_STORAGE_KEY, 'sepia');
    expect(readStoredThemePreference(getStorage)).toBe('system');

    localStorage.setItem(THEME_STORAGE_KEY, '');
    expect(readStoredThemePreference(getStorage)).toBe('system');
  });

  it('contains storage read and write failures', () => {
    const unavailableReader = {
      getItem: vi.fn(() => {
        throw new DOMException('Storage unavailable');
      }),
    };
    const unavailableWriter = {
      setItem: vi.fn(() => {
        throw new DOMException('Storage unavailable');
      }),
    };

    expect(readStoredThemePreference(() => unavailableReader)).toBe('system');
    expect(() => writeStoredThemePreference('dark', () => unavailableWriter))
      .not.toThrow();
  });

  it('contains failures while acquiring browser storage', () => {
    const storageDescriptor = Object.getOwnPropertyDescriptor(
      window,
      'localStorage',
    );
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException(
          'Storage unavailable',
          'SecurityError',
        );
      },
    });

    try {
      expect(readStoredThemePreference()).toBe('system');
      expect(() => writeStoredThemePreference('dark')).not.toThrow();
    } finally {
      if (storageDescriptor) {
        Object.defineProperty(window, 'localStorage', storageDescriptor);
      } else {
        Reflect.deleteProperty(window, 'localStorage');
      }
    }
  });

  it('persists theme changes without persisting mobile navigation state', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');

    useUiStore.getState().toggleMobileNav();
    expect(setItem).not.toHaveBeenCalled();

    useUiStore.getState().setThemePreference('dark');
    expect(useUiStore.getState().themePreference).toBe('dark');
    expect(setItem).toHaveBeenCalledOnce();
    expect(setItem).toHaveBeenCalledWith(THEME_STORAGE_KEY, 'dark');
  });

  it('applies the resolved theme to the supplied document root', () => {
    applyTheme('dark');
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(document.documentElement).toHaveClass('dark');

    applyTheme('light');
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    expect(document.documentElement).not.toHaveClass('dark');
  });
});
