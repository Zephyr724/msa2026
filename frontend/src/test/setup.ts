import '@testing-library/jest-dom/vitest';

// jsdom exposes scrollTo but reports it as unimplemented. Keep route-level
// scroll restoration observable in tests without emitting browser-only errors.
Object.defineProperty(window, 'scrollTo', {
  configurable: true,
  value: () => undefined,
  writable: true,
});
