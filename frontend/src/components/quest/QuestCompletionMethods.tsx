import { FileCheck2, KeyRound, NotebookPen } from 'lucide-react';
import { useState } from 'react';
import type {
  QuestRegistrationMode,
  QuestSourceType,
} from '../../types/quest.ts';
import QuestCompletionPanel from './QuestCompletionPanel.tsx';
import TrustedCompletionPanel from './TrustedCompletionPanel.tsx';

type CompletionChoice = 'code' | 'claim' | 'self';

interface QuestCompletionMethodsProps {
  questId: string;
  questTitle: string;
  registrationMode: QuestRegistrationMode | null;
  sourceType: QuestSourceType;
  xpAward: number;
}

const METHOD_PRESENTATION = {
  code: {
    Icon: KeyRound,
    label: 'Completion code',
    supporting: 'Organizer-issued verification',
  },
  claim: {
    Icon: FileCheck2,
    label: 'Submit evidence',
    supporting: 'Private Admin review',
  },
  self: {
    Icon: NotebookPen,
    label: 'Self-report',
    supporting: 'Passport only · no XP',
  },
} satisfies Record<CompletionChoice, {
  Icon: typeof KeyRound;
  label: string;
  supporting: string;
}>;

/**
 * The existing public Quest contract does not expose a separate method list.
 * These choices therefore use the accepted authoritative boundaries already
 * present in that contract: Native Quests may offer codes, Organizer-owned
 * Quests cannot accept evidence claims, and self-report remains explicitly
 * non-verified. Server enforcement is still final for every submission.
 */
export default function QuestCompletionMethods({
  questId,
  questTitle,
  registrationMode,
  sourceType,
  xpAward,
}: QuestCompletionMethodsProps) {
  const choices: CompletionChoice[] = [
    ...(sourceType === 'OrganizerOwned' && registrationMode === 'Native'
      ? ['code' as const]
      : []),
    ...(sourceType !== 'OrganizerOwned' ? ['claim' as const] : []),
    'self',
  ];
  const [requestedChoice, setRequestedChoice] = useState<CompletionChoice>(
    choices[0],
  );
  const selected = choices.includes(requestedChoice)
    ? requestedChoice
    : choices[0];

  return (
    <section className="kiwi-panel overflow-hidden p-4" aria-labelledby="completion-method-heading">
      <div className="px-1 pb-4">
        <p className="kiwi-stat-label">Record your impact</p>
        <h2 className="mt-1 text-xl" id="completion-method-heading">
          Choose a completion method
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-base-content/60">
          Only methods supported by this Quest type are shown. Kiwimpact
          validates eligibility and status again when you submit.
        </p>
      </div>
      <div className="grid gap-2" role="tablist" aria-label="Completion method">
        {choices.map((choice) => {
          const presentation = METHOD_PRESENTATION[choice];
          const Icon = presentation.Icon;
          return (
            <button
              aria-selected={selected === choice}
              className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition-colors ${
                selected === choice
                  ? 'border-primary bg-primary/8'
                  : 'border-base-300 bg-base-100 hover:bg-secondary'
              }`}
              key={choice}
              onClick={() => setRequestedChoice(choice)}
              role="tab"
              type="button"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon aria-hidden="true" className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-extrabold">{presentation.label}</span>
                <span className="block text-xs text-base-content/55">{presentation.supporting}</span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-4" role="tabpanel">
        {selected === 'code' ? (
          <QuestCompletionPanel
            key={questId}
            questId={questId}
            questTitle={questTitle}
            registrationMode={registrationMode}
            xpAward={xpAward}
          />
        ) : (
          <TrustedCompletionPanel mode={selected} questId={questId} />
        )}
      </div>
    </section>
  );
}
