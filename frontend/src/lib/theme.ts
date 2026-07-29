export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = Exclude<ThemePreference, 'system'>;

export const THEME_STORAGE_KEY = 'kiwimpact.theme-preference';
export const SYSTEM_THEME_QUERY = '(prefers-color-scheme: dark)';

type ThemeStorageReader = Pick<Storage, 'getItem'>;
type ThemeStorageWriter = Pick<Storage, 'setItem'>;

function getBrowserStorage(): Storage {
  return window.localStorage;
}

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

export function resolveTheme(
  preference: ThemePreference,
  systemPrefersDark: boolean,
): ResolvedTheme {
  if (preference === 'system') {
    return systemPrefersDark ? 'dark' : 'light';
  }

  return preference;
}

export function readStoredThemePreference(
  getStorage: () => ThemeStorageReader = getBrowserStorage,
): ThemePreference {
  try {
    const storage = getStorage();
    const storedPreference = storage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(storedPreference) ? storedPreference : 'system';
  } catch {
    return 'system';
  }
}

export function writeStoredThemePreference(
  preference: ThemePreference,
  getStorage: () => ThemeStorageWriter = getBrowserStorage,
): void {
  try {
    const storage = getStorage();
    storage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // The in-memory preference still applies when storage is unavailable.
  }
}

export function applyTheme(
  theme: ResolvedTheme,
  root: HTMLElement = document.documentElement,
): void {
  root.dataset.theme = theme;
  root.classList.toggle('dark', theme === 'dark');
}
