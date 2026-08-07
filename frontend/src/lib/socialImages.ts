const localDemoImageHost = 'local.kiwimpact.invalid';

/** Resolves only the fixed development-fixture host to bundled public assets. */
export function resolveSocialImageUrl(imageUrl: string): string {
  try {
    const parsed = new URL(imageUrl);
    return parsed.hostname === localDemoImageHost ? parsed.pathname : imageUrl;
  } catch {
    return imageUrl;
  }
}
