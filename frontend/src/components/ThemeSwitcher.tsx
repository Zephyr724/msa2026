import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import type { FocusEvent, KeyboardEvent } from 'react';
import type { ThemePreference } from '../lib/theme.ts';
import { useUiStore } from '../stores/useUiStore.ts';

interface ThemeOption {
  preference: ThemePreference;
  label: string;
  Icon: LucideIcon;
}

const themeOptions: ThemeOption[] = [
  { preference: 'light', label: 'Light', Icon: Sun },
  { preference: 'dark', label: 'Dark', Icon: Moon },
  { preference: 'system', label: 'System', Icon: Monitor },
];

export default function ThemeSwitcher() {
  const themePreference = useUiStore((state) => state.themePreference);
  const setThemePreference = useUiStore((state) => state.setThemePreference);
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionsId = useId();
  const currentOption = themeOptions.find(
    (option) => option.preference === themePreference,
  ) ?? themeOptions[2];
  const CurrentIcon = currentOption.Icon;

  function closeAndFocusTrigger() {
    setIsOpen(false);
    triggerRef.current?.focus();
  }

  function selectTheme(preference: ThemePreference) {
    setThemePreference(preference);
    closeAndFocusTrigger();
  }

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setIsOpen(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape' && isOpen) {
      event.preventDefault();
      closeAndFocusTrigger();
    }
  }

  return (
    <div
      className="relative"
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    >
      <button
        aria-controls={optionsId}
        aria-expanded={isOpen}
        aria-label={`Theme preference: ${currentOption.label}`}
        className="btn btn-ghost btn-sm gap-1 px-2"
        onClick={() => setIsOpen((open) => !open)}
        ref={triggerRef}
        type="button"
      >
        <CurrentIcon aria-hidden="true" className="size-4" />
        <span className="hidden lg:inline">{currentOption.label}</span>
      </button>

      {isOpen && (
        <div
          aria-label="Theme preference options"
          className="absolute right-0 z-50 mt-2 w-40 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg"
          id={optionsId}
          role="group"
        >
          {themeOptions.map(({ preference, label, Icon }) => (
            <button
              aria-pressed={themePreference === preference}
              className={`btn btn-ghost btn-sm w-full justify-start ${
                themePreference === preference ? 'btn-active' : ''
              }`}
              key={preference}
              onClick={() => selectTheme(preference)}
              type="button"
            >
              <Icon aria-hidden="true" className="size-4" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
