import { create } from 'zustand';

interface UiState {
  mobileNavOpen: boolean;
  themePreference: 'light' | 'dark' | 'system';
  toggleMobileNav: () => void;
  setThemePreference: (theme: 'light' | 'dark' | 'system') => void;
}

export const useUiStore = create<UiState>((set) => ({
  mobileNavOpen: false,
  themePreference: 'system',
  toggleMobileNav: () =>
    set((state) => ({ mobileNavOpen: !state.mobileNavOpen })),
  setThemePreference: (theme) => set({ themePreference: theme }),
}));