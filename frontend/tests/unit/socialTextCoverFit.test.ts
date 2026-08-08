import { afterEach, describe, expect, it } from 'vitest';
import { fitTextToContainer } from '../../src/lib/socialTextCover';

describe('fitTextToContainer', () => {
  afterEach(() => {
    document.body.replaceChildren();
    document.head.replaceChildren();
  });

  function setPreferredFontSize() {
    const style = document.createElement('style');
    style.textContent = '.cover-text { font-size: 24px; } .padded-cover { padding: 20px 0; }';
    document.head.append(style);
  }

  it('keeps a fitting sentence at its preferred font size', () => {
    setPreferredFontSize();
    const container = document.createElement('div');
    container.className = 'padded-cover';
    const text = document.createElement('p');
    text.className = 'cover-text';
    text.textContent = 'A short complete sentence.';
    Object.defineProperty(container, 'clientHeight', { value: 200 });
    Object.defineProperty(text, 'scrollHeight', { value: 80 });
    document.body.append(container, text);

    fitTextToContainer(container, text);

    expect(text.style.fontSize).toBe('');
    expect(window.getComputedStyle(text).fontSize).toBe('24px');
    expect(text).toHaveTextContent('A short complete sentence.');
  });

  it('shrinks an overflowing sentence without removing any text', () => {
    setPreferredFontSize();
    const sentence = 'A long first sentence remains complete even when the cover has limited room.';
    const container = document.createElement('div');
    container.className = 'padded-cover';
    const text = document.createElement('p');
    text.className = 'cover-text';
    text.textContent = sentence;
    Object.defineProperty(container, 'clientHeight', { value: 140 });
    Object.defineProperty(text, 'scrollHeight', {
      get: () => Number.parseFloat(window.getComputedStyle(text).fontSize) * 8,
    });
    document.body.append(container, text);

    fitTextToContainer(container, text);

    expect(Number.parseFloat(text.style.fontSize)).toBeLessThan(24);
    expect(text.scrollHeight).toBeLessThanOrEqual(container.clientHeight - 40);
    expect(text).toHaveTextContent(sentence);
  });
});
