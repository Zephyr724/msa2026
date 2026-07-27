import type { PassportCompletionItem } from '../types/passport.ts';
import type { MyProgression } from '../types/progression.ts';
import { CATEGORY_PRESENTATION } from './questPresentation.ts';

export const SHARE_CARD_THEMES = ['forest', 'ocean', 'sunrise'] as const;
export const SHARE_CARD_OVERLAYS = ['dark', 'light'] as const;

export type ShareCardTheme = (typeof SHARE_CARD_THEMES)[number];
export type ShareCardOverlay = (typeof SHARE_CARD_OVERLAYS)[number];

export interface ShareCardOptions {
  completion: PassportCompletionItem;
  displayName: string;
  overlay: ShareCardOverlay;
  progression: MyProgression;
  showName: boolean;
  theme: ShareCardTheme;
}

interface Palette {
  backgroundStart: string;
  backgroundEnd: string;
  accent: string;
}

const PALETTES: Record<ShareCardTheme, Palette> = {
  forest: {
    backgroundStart: '#123d2b',
    backgroundEnd: '#2f8f5b',
    accent: '#a7f3d0',
  },
  ocean: {
    backgroundStart: '#102d45',
    backgroundEnd: '#287da1',
    accent: '#bae6fd',
  },
  sunrise: {
    backgroundStart: '#5b2f24',
    backgroundEnd: '#c26d3d',
    accent: '#fde68a',
  },
};

export function drawShareCard(
  canvas: HTMLCanvasElement,
  options: ShareCardOptions,
): boolean {
  const context = canvas.getContext('2d');
  if (!context) return false;

  const size = 1080;
  canvas.width = size;
  canvas.height = size;
  const palette = PALETTES[options.theme];
  const category = CATEGORY_PRESENTATION[options.completion.questCategory];
  const foreground = options.overlay === 'dark' ? '#ffffff' : '#13211b';
  const muted = options.overlay === 'dark'
    ? 'rgba(255,255,255,0.72)'
    : 'rgba(19,33,27,0.72)';
  const glass = options.overlay === 'dark'
    ? 'rgba(255,255,255,0.16)'
    : 'rgba(255,255,255,0.64)';

  const gradient = context.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, palette.backgroundStart);
  gradient.addColorStop(1, palette.backgroundEnd);
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  context.save();
  context.globalAlpha = options.overlay === 'dark' ? 0.18 : 0.3;
  context.strokeStyle = palette.accent;
  context.lineWidth = 3;
  for (let offset = -360; offset < 1260; offset += 135) {
    context.beginPath();
    context.arc(880, 180, Math.abs(offset) + 190, 0.6, 2.7);
    context.stroke();
  }
  context.restore();

  context.fillStyle = options.overlay === 'dark'
    ? 'rgba(8,22,16,0.48)'
    : 'rgba(255,255,255,0.48)';
  context.fillRect(0, 0, size, size);

  context.fillStyle = foreground;
  context.font = '700 31px Manrope, system-ui, sans-serif';
  context.fillText('KIWIMPACT', 72, 92);
  context.font = '600 22px Manrope, system-ui, sans-serif';
  context.fillStyle = muted;
  context.fillText('LOCAL ACTION · VERIFIED IMPACT', 72, 128);

  context.fillStyle = glass;
  roundedRect(context, 780, 62, 228, 74, 37);
  context.fill();
  context.fillStyle = foreground;
  context.font = '700 21px Manrope, system-ui, sans-serif';
  context.textAlign = 'center';
  context.fillText(category.label.toUpperCase(), 894, 107);
  context.textAlign = 'left';

  context.fillStyle = muted;
  context.font = '700 25px Manrope, system-ui, sans-serif';
  context.fillText(category.label.toUpperCase(), 72, 490);

  context.fillStyle = foreground;
  context.font = '700 64px Fredoka, Manrope, system-ui, sans-serif';
  const titleBottom = drawWrappedText(
    context,
    options.completion.questTitle,
    72,
    560,
    900,
    76,
    3,
  );

  context.fillStyle = muted;
  context.font = '500 27px Manrope, system-ui, sans-serif';
  context.fillText(
    new Date(options.completion.completedAtUtc).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    72,
    titleBottom + 44,
  );

  const badgeY = titleBottom + 82;
  drawBadge(context, 72, badgeY, 174, '✓  VERIFIED', glass, foreground);
  drawBadge(
    context,
    262,
    badgeY,
    188,
    options.completion.xpAmount === null
      ? '⚡  XP PENDING'
      : `⚡  +${options.completion.xpAmount} XP`,
    glass,
    foreground,
  );

  context.fillStyle = foreground;
  context.font = '700 36px Fredoka, Manrope, system-ui, sans-serif';
  if (options.showName) {
    context.fillText(options.displayName.slice(0, 60), 72, 942);
  }
  context.fillStyle = muted;
  context.font = '600 23px Manrope, system-ui, sans-serif';
  context.fillText(
    `Level ${options.progression.level} · ${options.progression.rankTitle}`,
    72,
    options.showName ? 982 : 952,
  );
  context.textAlign = 'right';
  context.fillText(`${options.progression.totalXp} total XP`, 1008, 952);
  context.fillText('KIWIMPACT PASSPORT', 1008, 988);
  context.textAlign = 'left';
  return true;
}

function drawBadge(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  text: string,
  background: string,
  foreground: string,
) {
  context.fillStyle = background;
  roundedRect(context, x, y, width, 52, 26);
  context.fill();
  context.fillStyle = foreground;
  context.font = '700 20px Manrope, system-ui, sans-serif';
  context.fillText(text, x + 18, y + 34);
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(
    x + width,
    y + height,
    x + width - radius,
    y + height,
  );
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
): number {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let line = '';

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width <= maxWidth || !line) {
      line = candidate;
      continue;
    }
    lines.push(line);
    line = word;
    if (lines.length === maxLines - 1) break;
  }
  if (line && lines.length < maxLines) lines.push(line);

  const consumedWords = lines.join(' ').split(/\s+/).length;
  if (consumedWords < words.length) {
    let finalLine = `${lines.at(-1) ?? ''}…`;
    while (context.measureText(finalLine).width > maxWidth && finalLine.length > 2) {
      finalLine = `${finalLine.slice(0, -2)}…`;
    }
    lines[lines.length - 1] = finalLine;
  }

  lines.forEach((value, index) => {
    context.fillText(value, x, y + index * lineHeight);
  });
  return y + Math.max(lines.length - 1, 0) * lineHeight;
}
