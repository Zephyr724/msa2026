// ── Exact Region type union (mirrors C# RegionType enum) ─────────────

export type RegionType = "Country" | "AdministrativeArea" | "LocalArea";

// ── DTO Interface ────────────────────────────────────────────────────

export interface RegionSummaryDto {
  id: string;
  name: string;
  type: RegionType;
  parentRegionId: string | null;
}
