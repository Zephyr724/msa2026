import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ThemeSwitcher from '../../src/components/ThemeSwitcher.tsx';
import { useThemeSync } from '../../src/hooks/useThemeSync.ts';
import { SYSTEM_THEME_QUERY, THEME_STORAGE_KEY } from '../../src/lib/theme.ts';
import { useUiStore } from '../../src/stores/useUiStore.ts';

function Harness() {
  useThemeSync();
  return <ThemeSwitcher />;
}

function stubLightSystemTheme() {
  vi.stubGlobal('matchMedia', vi.fn(() => ({
    matches: false,
    media: SYSTEM_THEME_QUERY,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  } as unknown as MediaQueryList)));
}

describe('ThemeSwitcher', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
    useUiStore.setState({ mobileNavOpen: false, themePreference: 'system' });
    stubLightSystemTheme();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    useUiStore.setState({ mobileNavOpen: false, themePreference: 'system' });
  });

  it('exposes all preferences and persists the selected resolved theme', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const trigger = screen.getByRole('button', {
      name: 'Theme preference: System',
    });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const options = screen.getByRole('group', {
      name: 'Theme preference options',
    });
    expect(within(options).getByRole('button', { name: 'System' }))
      .toHaveAttribute('aria-pressed', 'true');

    await user.click(within(options).getByRole('button', { name: 'Dark' }));

    expect(screen.queryByRole('group', { name: 'Theme preference options' }))
      .not.toBeInTheDocument();
    const darkTrigger = screen.getByRole('button', {
      name: 'Theme preference: Dark',
    });
    expect(darkTrigger).toHaveAttribute('aria-expanded', 'false');
    expect(darkTrigger).toHaveFocus();
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });

  it('closes on Escape and restores focus to the disclosure trigger', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const trigger = screen.getByRole('button', {
      name: 'Theme preference: System',
    });
    trigger.focus();
    await user.keyboard('{Enter}');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const lightOption = screen.getByRole('button', { name: 'Light' });
    lightOption.focus();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('group', { name: 'Theme preference options' }))
      .not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });
});
