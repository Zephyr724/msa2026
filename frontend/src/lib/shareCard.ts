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

  drawThemeScene(context, options.theme, palette, size);

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
  roundedRect(context, 744, 62, 264, 74, 37);
  context.fill();
  drawCategoryEmblem(
    context,
    780,
    99,
    options.completion.questCategory,
    palette.accent,
    foreground,
  );
  context.fillStyle = foreground;
  context.font = '700 19px Manrope, system-ui, sans-serif';
  context.textAlign = 'left';
  context.fillText(category.label.toUpperCase(), 814, 107);
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

  drawRankCrest(context, 72, 887, options.progression.rankTitle, palette.accent);
  context.fillStyle = foreground;
  context.font = '700 34px Fredoka, Manrope, system-ui, sans-serif';
  if (options.showName) {
    context.fillText(options.displayName.slice(0, 60), 142, 928);
  }
  context.fillStyle = muted;
  context.font = '600 23px Manrope, system-ui, sans-serif';
  context.fillText(
    `Level ${options.progression.level} · ${options.progression.rankTitle}`,
    142,
    options.showName ? 968 : 935,
  );
  context.textAlign = 'right';
  context.fillText(`${options.progression.totalXp} total XP`, 1008, 952);
  context.fillText('KIWIMPACT PASSPORT', 1008, 988);
  context.textAlign = 'left';
  return true;
}

function drawThemeScene(
  context: CanvasRenderingContext2D,
  theme: ShareCardTheme,
  palette: Palette,
  size: number,
) {
  context.save();
  context.globalAlpha = 0.82;

  if (theme === 'forest') {
    context.fillStyle = '#0b2c20';
    context.beginPath();
    context.moveTo(0, 430);
    context.quadraticCurveTo(220, 250, 470, 430);
    context.quadraticCurveTo(720, 210, size, 405);
    context.lineTo(size, 0);
    context.lineTo(0, 0);
    context.closePath();
    context.fill();
    context.fillStyle = '#2f8f5b';
    for (const x of [90, 190, 820, 940]) {
      context.beginPath();
      context.moveTo(x, 420);
      context.lineTo(x + 52, 278);
      context.lineTo(x + 104, 420);
      context.closePath();
      context.fill();
    }
  } else if (theme === 'ocean') {
    context.fillStyle = '#0d3855';
    context.fillRect(0, 0, size, 360);
    context.strokeStyle = palette.accent;
    context.lineWidth = 18;
    for (let y = 250; y <= 430; y += 58) {
      context.beginPath();
      context.moveTo(-40, y);
      for (let x = -40; x <= size + 80; x += 120) {
        context.quadraticCurveTo(x + 30, y - 24, x + 60, y);
        context.quadraticCurveTo(x + 90, y + 24, x + 120, y);
      }
      context.stroke();
    }
  } else {
    const sun = context.createLinearGradient(0, 0, 0, 500);
    sun.addColorStop(0, '#f7c86c');
    sun.addColorStop(1, '#c26d3d');
    context.fillStyle = sun;
    context.fillRect(0, 0, size, 440);
    context.fillStyle = '#ffe9a8';
    context.beginPath();
    context.arc(820, 245, 116, Math.PI, 0);
    context.closePath();
    context.fill();
    context.fillStyle = '#713d2d';
    context.beginPath();
    context.moveTo(0, 440);
    context.quadraticCurveTo(250, 280, 520, 440);
    context.quadraticCurveTo(780, 300, size, 430);
    context.lineTo(size, 0);
    context.lineTo(0, 0);
    context.closePath();
    context.fill();
  }
  context.restore();
}

function drawCategoryEmblem(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  category: PassportCompletionItem['questCategory'],
  accent: string,
  foreground: string,
) {
  context.save();
  context.fillStyle = accent;
  context.beginPath();
  context.arc(x, y, 23, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = foreground;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.lineWidth = 3;
  context.beginPath();
  if (category === 'CleanReduceWaste') {
    context.moveTo(x - 10, y - 7);
    context.lineTo(x + 10, y - 7);
    context.moveTo(x - 6, y - 12);
    context.lineTo(x + 6, y - 12);
    context.moveTo(x - 7, y - 4);
    context.lineTo(x - 5, y + 12);
    context.lineTo(x + 5, y + 12);
    context.lineTo(x + 7, y - 4);
  } else if (category === 'ObserveMeasure') {
    context.arc(x - 3, y - 2, 9, 0, Math.PI * 2);
    context.moveTo(x + 4, y + 5);
    context.lineTo(x + 12, y + 13);
  } else {
    context.moveTo(x - 10, y + 8);
    context.quadraticCurveTo(x - 7, y - 12, x + 12, y - 10);
    context.quadraticCurveTo(x + 10, y + 8, x - 10, y + 8);
    context.moveTo(x - 8, y + 7);
    context.lineTo(x + 8, y - 6);
  }
  context.stroke();
  context.restore();
}

function drawRankCrest(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  rankTitle: string,
  accent: string,
) {
  context.save();
  context.fillStyle = accent;
  context.beginPath();
  context.moveTo(x + 28, y);
  context.lineTo(x + 54, y + 10);
  context.lineTo(x + 54, y + 34);
  context.quadraticCurveTo(x + 54, y + 52, x + 28, y + 64);
  context.quadraticCurveTo(x + 2, y + 52, x + 2, y + 34);
  context.lineTo(x + 2, y + 10);
  context.closePath();
  context.fill();
  context.fillStyle = '#ffffff';
  context.font = '700 24px Fredoka, Manrope, system-ui, sans-serif';
  context.textAlign = 'center';
  context.fillText(rankTitle.slice(0, 1).toUpperCase(), x + 28, y + 39);
  context.textAlign = 'left';
  context.restore();
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
