// ── Slice 5B Passport completion-history contract ─────────────────
// Exact frontend mirror of `PassportCompletionItemDto` and the existing
// `PagedResponse<T>` envelope (specs/implementation/05b-passport-lite.md §8).
// Verified + CompletionCode are the only implemented status and method; a
// future completion-method Slice broadens backend, DTO/validator, and UI
// labels together (m2).

import type { PagedResponse, QuestCategory } from './quest.ts';

export const PASSPORT_QUEST_STATUSES = [
  'Published',
  'Cancelled',
  'Archived',
] as const;

export type PassportQuestStatus = (typeof PASSPORT_QUEST_STATUSES)[number];

export interface PassportCompletionItem {
  completionId: string;
  questId: string;
  questTitle: string;
  questCategory: QuestCategory;
  questStatus: PassportQuestStatus;
  status: 'Verified';
  method: 'CompletionCode';
  completedAtUtc: string;
  verifiedAtUtc: string;
  /** Null for an ordinary reward-pending row; never estimated client-side. */
  xpAmount: number | null;
}

export type PassportCompletionsPage = PagedResponse<PassportCompletionItem>;
