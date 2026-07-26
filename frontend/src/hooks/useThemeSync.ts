import { useEffect } from 'react';
import {
  applyTheme,
  resolveTheme,
  SYSTEM_THEME_QUERY,
} from '../lib/theme.ts';
import { useUiStore } from '../stores/useUiStore.ts';

export function useThemeSync(): void {
  const themePreference = useUiStore((state) => state.themePreference);

  useEffect(() => {
    if (themePreference !== 'system') {
      applyTheme(themePreference);
      return;
    }

    if (typeof window.matchMedia !== 'function') {
      applyTheme('light');
      return;
    }

    const systemTheme = window.matchMedia(SYSTEM_THEME_QUERY);
    const applySystemTheme = () => {
      applyTheme(resolveTheme('system', systemTheme.matches));
    };

    applySystemTheme();
    systemTheme.addEventListener('change', applySystemTheme);

    return () => {
      systemTheme.removeEventListener('change', applySystemTheme);
    };
  }, [themePreference]);
}
