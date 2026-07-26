import { create } from 'zustand';
import {
  readStoredThemePreference,
  type ThemePreference,
  writeStoredThemePreference,
} from '../lib/theme.ts';

interface UiState {
  mobileNavOpen: boolean;
  themePreference: ThemePreference;
  toggleMobileNav: () => void;
  setThemePreference: (theme: ThemePreference) => void;
}

const initialThemePreference = typeof window === 'undefined'
  ? 'system'
  : readStoredThemePreference(window.localStorage);

export const useUiStore = create<UiState>((set) => ({
  mobileNavOpen: false,
  themePreference: initialThemePreference,
  toggleMobileNav: () =>
    set((state) => ({ mobileNavOpen: !state.mobileNavOpen })),
  setThemePreference: (theme) => {
    set({ themePreference: theme });
    if (typeof window !== 'undefined') {
      writeStoredThemePreference(window.localStorage, theme);
    }
  },
}));
