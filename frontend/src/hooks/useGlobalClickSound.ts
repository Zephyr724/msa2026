import { useEffect } from 'react';
import { playUiSound } from '../lib/uiSounds.ts';

/**
 * Plays the click sound for button-like elements anywhere in the app,
 * including navigation links. Dialogs are excluded because confirm/cancel
 * buttons play their own sounds.
 */
export function useGlobalClickSound(): void {
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest('dialog')) return;
      const control = target.closest('button, a.btn, nav a, [role="button"]');
      if (!control) return;
      // The mute toggle handles its own feedback: silencing the click that
      // mutes, playing one when sound is switched back on.
      if (control.hasAttribute('data-no-click-sound')) return;
      if (control.getAttribute('aria-disabled') === 'true') return;
      playUiSound('click');
    }

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);
}
