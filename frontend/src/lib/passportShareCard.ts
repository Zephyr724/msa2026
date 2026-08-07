import type { AchievementTrophyTier } from '../types/achievement.ts';
import type { PassportSummary } from '../types/passport.ts';
import type { MyProgression } from '../types/progression.ts';
import { CATEGORY_PRESENTATION } from './questPresentation.ts';
import type { ShareCardOverlay, ShareCardTheme } from './shareCard.ts';

export interface PassportShareArtworkIdentity {
  tier: AchievementTrophyTier | undefined;
  badgeKeys: string[];
}

export interface PassportShareTrophy {
  tier: AchievementTrophyTier;
  image: HTMLImageElement | null;
  rarity?: string;
}

export interface PassportShareAchievement {
  label: string;
  image: HTMLImageElement | null;
  rarity?: string;
}

export interface PassportShareCardOptions {
  achievements: PassportShareAchievement[];
  displayName: string;
  overlay: ShareCardOverlay;
  passport: PassportSummary;
  progression: MyProgression;
  showName: boolean;
  theme: ShareCardTheme;
  trophy?: PassportShareTrophy;
}

const PALETTES: Record<ShareCardTheme, {
  start: string;
  end: string;
  accent: string;
}> = {
  forest: { start: '#0d3022', end: '#287d50', accent: '#a7f3d0' },
  ocean: { start: '#102b43', end: '#247b9d', accent: '#bae6fd' },
  sunrise: { start: '#51281f', end: '#bd6438', accent: '#fde68a' },
};

export function isCurrentPassportArtwork(
  artwork: PassportShareArtworkIdentity,
  tier: AchievementTrophyTier | undefined,
  badgeKeys: string[],
): boolean {
  return artwork.tier === tier
    && artwork.badgeKeys.length === badgeKeys.length
    && artwork.badgeKeys.every((key, index) => key === badgeKeys[index]);
}

/** Draw the privacy-safe, whole-Passport snapshot used by preview and export. */
export function drawPassportShareCard(
  canvas: HTMLCanvasElement,
  options: PassportShareCardOptions,
): boolean {
  const context = canvas.getContext('2d');
  if (!context) return false;

  const size = 1080;
  canvas.width = size;
  canvas.height = size;
  const palette = PALETTES[options.theme];
  const foreground = options.overlay === 'dark' ? '#ffffff' : '#13211b';
  const muted = options.overlay === 'dark'
    ? 'rgba(255,255,255,0.72)'
    : 'rgba(19,33,27,0.72)';
  const glass = options.overlay === 'dark'
    ? 'rgba(255,255,255,0.14)'
    : 'rgba(255,255,255,0.68)';

  const gradient = context.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, palette.start);
  gradient.addColorStop(1, palette.end);
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  drawBackgroundPattern(context, palette.accent, options.theme);
  context.fillStyle = options.overlay === 'dark'
    ? 'rgba(5,18,12,0.30)'
    : 'rgba(255,255,255,0.30)';
  context.fillRect(0, 0, size, size);

  context.fillStyle = foreground;
  context.font = '700 31px Manrope, system-ui, sans-serif';
  context.fillText('KIWIMPACT', 68, 82);
  context.fillStyle = muted;
  context.font = '600 20px Manrope, system-ui, sans-serif';
  context.fillText('PERSONAL IMPACT PASSPORT', 68, 116);

  context.fillStyle = foreground;
  context.font = '700 58px Fredoka, Manrope, system-ui, sans-serif';
  context.fillText(
    options.showName ? options.displayName.slice(0, 40) : 'MY IMPACT PASSPORT',
    68,
    202,
  );
  context.fillStyle = muted;
  context.font = '600 26px Manrope, system-ui, sans-serif';
  context.fillText(
    `Level ${options.progression.level} · ${options.progression.rankTitle} · ${options.progression.totalXp} XP`,
    68,
    244,
  );

  if (options.trophy) {
    context.fillStyle = glass;
    roundedRect(context, 790, 54, 222, 218, 34);
    context.fill();
    if (options.trophy.image) {
      context.drawImage(options.trophy.image, 831, 66, 140, 140);
    } else {
      drawTrophyFallback(context, 901, 136, palette.accent, muted);
    }
    context.fillStyle = foreground;
    context.textAlign = 'center';
    if (options.trophy.tier === 'Locked') {
      context.font = '700 18px Fredoka, Manrope, system-ui, sans-serif';
      context.fillText('FIRST TROPHY', 901, 220);
      context.fillText('AWAITS', 901, 242);
    } else {
      context.font = '700 22px Fredoka, Manrope, system-ui, sans-serif';
      context.fillText(`${options.trophy.tier.toUpperCase()} TROPHY`, 901, 232);
    }
    if (options.trophy.rarity) {
      context.fillStyle = muted;
      context.font = '600 14px Manrope, system-ui, sans-serif';
      context.fillText(`${options.trophy.rarity} RARITY`, 901, 260);
    }
    context.textAlign = 'left';
  }

  const stats = [
    ['VERIFIED QUESTS', String(options.passport.verifiedCompletionCount)],
    ['ACHIEVEMENTS', String(options.achievements.length)],
    ['SELF-REPORTED', String(options.passport.selfReportedCompletionCount)],
  ];
  stats.forEach(([label, value], index) => {
    const x = 68 + index * 320;
    context.fillStyle = glass;
    roundedRect(context, x, 306, 294, 112, 26);
    context.fill();
    context.fillStyle = foreground;
    context.font = '700 38px Fredoka, Manrope, system-ui, sans-serif';
    context.fillText(value, x + 24, 356);
    context.fillStyle = muted;
    context.font = '700 17px Manrope, system-ui, sans-serif';
    context.fillText(label, x + 24, 389);
  });

  context.fillStyle = muted;
  context.font = '700 18px Manrope, system-ui, sans-serif';
  context.fillText('VERIFIED IMPACT BY CATEGORY', 68, 470);
  const categoryImpact = options.passport.categoryImpact.slice(0, 3);
  categoryImpact.forEach((impact, index) => {
    const x = 68 + index * 320;
    context.fillStyle = glass;
    roundedRect(context, x, 492, 294, 92, 24);
    context.fill();
    context.fillStyle = foreground;
    context.font = '700 19px Manrope, system-ui, sans-serif';
    context.fillText(CATEGORY_PRESENTATION[impact.category].label, x + 22, 528);
    context.fillStyle = muted;
    context.font = '600 17px Manrope, system-ui, sans-serif';
    context.fillText(
      `${impact.verifiedCompletionCount} verified · ${impact.verifiedXp} XP`,
      x + 22,
      558,
    );
  });

  context.fillStyle = foreground;
  context.font = '700 29px Fredoka, Manrope, system-ui, sans-serif';
  context.fillText('EARNED ACHIEVEMENTS', 68, 642);
  context.fillStyle = muted;
  context.font = '600 18px Manrope, system-ui, sans-serif';
  context.fillText(
    options.achievements.length === 0
      ? 'Your first achievement awaits.'
      : `${options.achievements.length} earned milestone${options.achievements.length === 1 ? '' : 's'}`,
    68,
    674,
  );

  drawAllAchievements(context, options.achievements, {
    foreground,
    glass,
    muted,
  });

  context.save();
  context.globalAlpha = 0.42;
  context.strokeStyle = palette.accent;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(68, 1004);
  context.lineTo(1012, 1004);
  context.stroke();
  context.restore();
  context.fillStyle = muted;
  context.font = '600 17px Manrope, system-ui, sans-serif';
  context.fillText('LOCAL ACTION · LASTING IMPACT', 68, 1038);
  context.textAlign = 'right';
  context.fillText('PRIVACY-SAFE PASSPORT SNAPSHOT', 1012, 1038);
  context.textAlign = 'left';
  return true;
}

function drawAllAchievements(
  context: CanvasRenderingContext2D,
  achievements: PassportShareAchievement[],
  colors: { foreground: string; glass: string; muted: string },
) {
  if (achievements.length === 0) return;
  const columns = Math.min(
    9,
    Math.max(1, achievements.length <= 4 ? achievements.length : Math.ceil(Math.sqrt(achievements.length * 1.8))),
  );
  const rows = Math.ceil(achievements.length / columns);
  const areaX = 68;
  const areaY = 706;
  const areaWidth = 944;
  const areaHeight = 270;
  const cellWidth = areaWidth / columns;
  const cellHeight = areaHeight / rows;
  const hasRarityLabels = achievements.some((achievement) => achievement.rarity);
  const showLabels = achievements.length <= 18 && cellHeight >= (hasRarityLabels ? 80 : 62);
  const imageSize = Math.max(
    30,
    Math.min(78, cellWidth - 18, cellHeight - (showLabels ? (hasRarityLabels ? 48 : 29) : 10)),
  );

  context.save();
  context.textAlign = 'center';
  achievements.forEach((achievement, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const centerX = areaX + column * cellWidth + cellWidth / 2;
    const top = areaY + row * cellHeight + 4;
    if (achievement.image) {
      context.drawImage(
        achievement.image,
        centerX - imageSize / 2,
        top,
        imageSize,
        imageSize,
      );
    } else {
      drawBadgeFallback(
        context,
        centerX,
        top + imageSize / 2,
        imageSize / 2,
        colors.glass,
      );
    }
    if (showLabels) {
      context.fillStyle = colors.foreground;
      context.font = '600 14px Manrope, system-ui, sans-serif';
      context.fillText(
        truncate(achievement.label, columns <= 4 ? 26 : 15),
        centerX,
        top + imageSize + 19,
      );
      if (achievement.rarity) {
        context.fillStyle = colors.muted;
        context.font = '600 12px Manrope, system-ui, sans-serif';
        context.fillText(achievement.rarity, centerX, top + imageSize + 38);
      }
    }
  });
  context.restore();
}

function drawBackgroundPattern(
  context: CanvasRenderingContext2D,
  accent: string,
  theme: ShareCardTheme,
) {
  context.save();
  context.globalAlpha = theme === 'sunrise' ? 0.14 : 0.10;
  context.strokeStyle = accent;
  context.lineWidth = 3;
  for (let radius = 180; radius <= 900; radius += 120) {
    context.beginPath();
    context.arc(920, 180, radius, 0.55, 2.85);
    context.stroke();
  }
  context.restore();
}

function drawTrophyFallback(
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  accent: string,
  muted: string,
) {
  context.save();
  context.fillStyle = accent;
  context.beginPath();
  context.moveTo(centerX - 30, centerY - 38);
  context.lineTo(centerX + 30, centerY - 38);
  context.quadraticCurveTo(centerX + 30, centerY + 8, centerX, centerY + 12);
  context.quadraticCurveTo(centerX - 30, centerY + 8, centerX - 30, centerY - 38);
  context.closePath();
  context.fill();
  context.fillRect(centerX - 6, centerY + 12, 12, 17);
  roundedRect(context, centerX - 23, centerY + 29, 46, 12, 6);
  context.fill();
  context.fillStyle = muted;
  context.beginPath();
  context.arc(centerX, centerY - 14, 9, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawBadgeFallback(
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  fill: string,
) {
  context.fillStyle = fill;
  context.beginPath();
  context.moveTo(centerX, centerY - radius);
  context.lineTo(centerX + radius * 0.86, centerY - radius / 2);
  context.lineTo(centerX + radius * 0.86, centerY + radius / 2);
  context.lineTo(centerX, centerY + radius);
  context.lineTo(centerX - radius * 0.86, centerY + radius / 2);
  context.lineTo(centerX - radius * 0.86, centerY - radius / 2);
  context.closePath();
  context.fill();
}

function truncate(value: string, maxLength: number): string {
  return value.length > maxLength
    ? `${value.slice(0, maxLength - 1)}…`
    : value;
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
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}
