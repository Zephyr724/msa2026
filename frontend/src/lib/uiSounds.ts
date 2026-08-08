import { useSyncExternalStore } from "react";

export type UiSoundName = "click" | "confirm" | "cancel" | "achievement";

export const SOUND_MUTED_STORAGE_KEY = "kiwimpact.sound-muted";

// Sounds are Kenney CC0 assets (see frontend/public/sounds/README.md). m4a/AAC
// is used because it plays in every modern browser, including Safari.
const SOUND_SOURCES: Record<UiSoundName, string> = {
  click: `${import.meta.env.BASE_URL}sounds/click.m4a`,
  confirm: `${import.meta.env.BASE_URL}sounds/confirm.m4a`,
  cancel: `${import.meta.env.BASE_URL}sounds/cancel.m4a`,
  achievement: `${import.meta.env.BASE_URL}sounds/achievement.m4a`,
};

// Short feedback sounds should sit under the content, not on top of it.
const SOUND_VOLUMES: Record<UiSoundName, number> = {
  click: 1.0,
  confirm: 0.3,
  cancel: 0.9,
  achievement: 0.7,
};

function readStoredSoundMuted(): boolean {
  try {
    return window.localStorage.getItem(SOUND_MUTED_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function writeStoredSoundMuted(muted: boolean): void {
  try {
    window.localStorage.setItem(SOUND_MUTED_STORAGE_KEY, String(muted));
  } catch {
    // Storage may be unavailable (private mode); playback stays unmuted then.
  }
}

const muteListeners = new Set<() => void>();

export function isSoundMuted(): boolean {
  return readStoredSoundMuted();
}

export function setSoundMuted(muted: boolean): void {
  if (readStoredSoundMuted() === muted) return;
  writeStoredSoundMuted(muted);
  muteListeners.forEach((listener) => listener());
}

function subscribeSoundMuted(listener: () => void): () => void {
  muteListeners.add(listener);
  return () => muteListeners.delete(listener);
}

export function useSoundMuted(): boolean {
  return useSyncExternalStore(subscribeSoundMuted, isSoundMuted, () => false);
}

const audioElements = new Map<UiSoundName, HTMLAudioElement>();

function getAudioElement(name: UiSoundName): HTMLAudioElement {
  let audio = audioElements.get(name);
  if (!audio) {
    audio = new Audio(SOUND_SOURCES[name]);
    audio.preload = "auto";
    audioElements.set(name, audio);
  }
  // Volume is read on every play so tweaks take effect after a refresh even
  // when a hot update kept this module instance (and its audio cache) alive.
  audio.volume = SOUND_VOLUMES[name];
  return audio;
}

/**
 * Plays a UI feedback sound. Never throws: autoplay restrictions, missing
 * media support, and storage failures all degrade to silence. The mute flag
 * is read from storage on every call so it stays correct even if this module
 * instance is stale (e.g. after a dev-server hot update) or the preference
 * was changed in another tab.
 */
export function playUiSound(name: UiSoundName): void {
  if (readStoredSoundMuted()) return;
  try {
    const audio = getAudioElement(name);
    audio.currentTime = 0;
    const playback = audio.play();
    if (playback) playback.catch(() => undefined);
  } catch {
    // Browsers that cannot decode or play the file stay silent.
  }
}
