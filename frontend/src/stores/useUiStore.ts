import { create } from 'zustand';
import {
  readStoredThemePreference,
  type ThemePreference,
  writeStoredThemePreference,
} from '../lib/theme.ts';

interface UiState {
  liveImpactStatus: 'connecting' | 'live' | 'reconnecting' | 'unavailable';
  mobileNavOpen: boolean;
  themePreference: ThemePreference;
  setLiveImpactStatus: (
    status: 'connecting' | 'live' | 'reconnecting' | 'unavailable',
  ) => void;
  toggleMobileNav: () => void;
  setThemePreference: (theme: ThemePreference) => void;
}

const initialThemePreference = readStoredThemePreference();

export const useUiStore = create<UiState>((set) => ({
  liveImpactStatus: 'connecting',
  mobileNavOpen: false,
  themePreference: initialThemePreference,
  setLiveImpactStatus: (liveImpactStatus) => set({ liveImpactStatus }),
  toggleMobileNav: () =>
    set((state) => ({ mobileNavOpen: !state.mobileNavOpen })),
  setThemePreference: (theme) => {
    set({ themePreference: theme });
    writeStoredThemePreference(theme);
  },
}));
