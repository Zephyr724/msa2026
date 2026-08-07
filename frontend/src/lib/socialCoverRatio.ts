export type SocialCoverCrop = 'tall' | 'wide' | null;

export function getSocialCoverCrop(width: number, height: number): SocialCoverCrop {
  if (width <= 0 || height <= 0) return null;

  const widthToHeight = width / height;
  if (widthToHeight < 0.76) return 'tall';
  if (widthToHeight > 4 / 3) return 'wide';
  return null;
}
