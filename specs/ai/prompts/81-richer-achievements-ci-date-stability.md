# Prompt 81 — Richer Achievements CI Date Stability

- **Date:** 2026-08-03
- **Branch:** `feat/richer-achievements-trophies`
- **Risk:** Low — test-only determinism correction

## Actual human instruction

After providing CI output for two backend integration failures and one
frontend integration failure, the human instructed:

> Then change them to more reasonable tests.

## Reconstructed implementation instruction

Correct the three tests so their expected behavior does not change as wall
clock time advances. Preserve production behavior and the intent of each
test:

- keep the profile-lock concurrency scenario inside one Auckland calendar
  week while retaining deterministic XP ordering;
- anchor the backdated reconciliation scenario exactly one week before its
  live redemption so it always exercises consecutive Auckland weeks; and
- keep the Mission Board active-Quest fixture in the future relative to the
  test run.

Run the three focused regressions and the applicable complete frontend and
backend verification gates. Record only observed results.
