// ── Slice 5B Progression contract ─────────────────────────────────
// Exact frontend mirror of the merged Slice 5A backend DTO
// `MyProgressionDto(long TotalXp, int Level, string RankTitle)`
// (backend/src/Kiwimpact.Api/Contracts/ProgressionContracts.cs). The DTO
// carries exactly these three keys; thresholds are never sent (D2/D3).

export interface MyProgression {
  totalXp: number;
  level: number;
  rankTitle: string;
}
