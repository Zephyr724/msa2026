# Prompt 79 — Slice 23 Richer Achievements, Rarity, Trophies, and Cosmetics

## Actual implementation instruction

The product owner instructed Codex to implement four later product tasks,
beginning with a richer achievement system and achievement-unlocked Passport
cosmetics. They then extended the achievement requirement:

> 增加很多成就，包括稀有成就，获得后，显示每个成就在全国完成人数，
> 百分比越低表示越稀有。
>
> 当成就到一定成就后，点亮一个独立的奖杯，有钻石，白金，黄金，
> 白银，青铜，一直下去（这个也显示稀有度，同时奖杯显示在nav的
> 用户名旁边成就能否加这个？ 其他方案同意

Codex must implement the approved contract in
`specs/implementation/23-richer-achievements-trophies.md` as the sole
implementation owner.

Required outcomes:

1. Create the approved 45-definition typed static catalog while preserving the
   existing three stable IDs/codes.
2. Add immutable completion category snapshots and a catalog evaluation
   version through one additive EF Core migration.
3. Generalize live and historical award evaluation across total completion,
   category, breadth, historical weekly streak, and level rules; preserve the
   existing Community Challenge reward path.
4. Publish national distinct-earner rarity aggregates without exposing user
   lists or private identity/location data.
5. Derive the Locked/Bronze/Silver/Gold/Platinum/Diamond trophy from lifetime
   distinct achievements and publish the current trophy's national rarity.
6. Derive allowlisted Passport border, avatar-frame, and badge-stamp styles
   from earned achievements without inventory or equip mutations.
7. Replace hard-coded milestone-only UI with grouped achievements, rarity,
   trophy progress, Passport cosmetics, and the navigation trophy.
8. Preserve cookie authentication, antiforgery, caller ownership, reward
   atomicity, deterministic backfill, strict response validation, responsive
   themes, and existing privacy boundaries.
9. Add focused backend, integration, migration, frontend, and UI tests.
10. Run applicable full gates, review the diff, write an observed completion
    report, and then obtain the single required independent read-only review.

Do not add dependencies, external services, a generic expression engine,
inventory, currency, a shop, real profile images, public user lists, or
regional rarity in this Slice.
