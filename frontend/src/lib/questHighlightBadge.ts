export function splitBadgeLabel(label: string): [string, string] {
  const words = badgeLabelWords(label);
  if (words.length < 2) return [words[0] ?? '', ''];

  let bestSplit: [string, string] = [words[0], words.slice(1).join(' ')];
  let bestScore = Number.POSITIVE_INFINITY;

  for (let index = 1; index < words.length; index += 1) {
    const top = words.slice(0, index).join(' ');
    const bottom = words.slice(index).join(' ');
    const longestLine = Math.max(top.length, bottom.length);
    const imbalance = Math.abs(top.length - bottom.length);
    const bottomHeavyPenalty = top.length < bottom.length ? 0.5 : 0;
    const score = longestLine * 2 + imbalance + bottomHeavyPenalty;

    if (score < bestScore) {
      bestSplit = [top, bottom];
      bestScore = score;
    }
  }

  return bestSplit;
}

export function getBadgeLabelLines(label: string): string[] {
  const words = badgeLabelWords(label);

  if (words.length <= 3) return words;

  if (/^\d+$/.test(words.at(-2) ?? '') && words.at(-1)?.toLowerCase() === 'left') {
    return [words[0], words.slice(1, -2).join(' '), words.slice(-2).join(' ')];
  }

  return splitBadgeLabel(label).filter(Boolean);
}

function badgeLabelWords(label: string): string[] {
  return label.replace(/[·•]/g, ' ').trim().split(/\s+/).filter(Boolean);
}
