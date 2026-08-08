export function firstCompleteSentence(content: string, fallback: string): string {
  const normalized = content.replace(/\s+/g, ' ').trim();
  const complete = normalized.match(/^.*?[.!?。！？](?:["'”’」』】）)]*)/u)?.[0];
  return (complete ?? normalized) || fallback;
}

const MIN_COVER_FONT_SIZE_PX = 1;

export function fitTextToContainer(container: HTMLElement, text: HTMLElement) {
  text.style.fontSize = '';

  const containerStyle = window.getComputedStyle(container);
  const verticalPadding = Number.parseFloat(containerStyle.paddingTop)
    + Number.parseFloat(containerStyle.paddingBottom);
  const siblingHeight = Array.from(container.children)
    .filter((child) => child !== text)
    .reduce((total, child) => total + (child as HTMLElement).offsetHeight, 0);
  const gaps = Math.max(0, container.children.length - 1);
  const availableHeight = container.clientHeight
    - verticalPadding
    - siblingHeight
    - (Number.parseFloat(containerStyle.rowGap) || 0) * gaps;
  const preferredFontSize = Number.parseFloat(window.getComputedStyle(text).fontSize);
  if (!availableHeight || !preferredFontSize || text.scrollHeight <= availableHeight) return;

  let smallestFit = MIN_COVER_FONT_SIZE_PX;
  let largestOverflow = preferredFontSize;

  text.style.fontSize = `${smallestFit}px`;
  if (text.scrollHeight > availableHeight) {
    text.style.fontSize = `${Math.max(
      MIN_COVER_FONT_SIZE_PX,
      smallestFit * (availableHeight / text.scrollHeight),
    )}px`;
    return;
  }

  for (let index = 0; index < 10; index += 1) {
    const candidate = (smallestFit + largestOverflow) / 2;
    text.style.fontSize = `${candidate}px`;
    if (text.scrollHeight <= availableHeight) smallestFit = candidate;
    else largestOverflow = candidate;
  }

  text.style.fontSize = `${smallestFit}px`;
}
