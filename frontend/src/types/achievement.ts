// ── Slice 6A achievement read contract ────────────────────────────
// Exact frontend mirrors of the DTOs documented in
// specs/architecture/03-api-contract.md §2.12. Codes and categories remain
// open strings so future catalog entries render through the client fallback.

export interface AchievementCatalogItem {
  id: string;
  code: string;
  name: string;
  description: string;
  iconUrl: string | null;
  category: string;
}

export interface EarnedAchievement {
  achievementId: string;
  code: string;
  name: string;
  description: string;
  iconUrl: string | null;
  category: string;
  awardedAt: string;
}
