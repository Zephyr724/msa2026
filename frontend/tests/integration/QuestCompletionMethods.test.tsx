import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import QuestCompletionMethods from '../../src/components/quest/QuestCompletionMethods.tsx';

vi.mock('../../src/components/quest/QuestCompletionPanel.tsx', () => ({
  default: () => <div>Code completion form</div>,
}));

vi.mock('../../src/components/quest/TrustedCompletionPanel.tsx', () => ({
  default: ({ mode }: { mode: 'claim' | 'self' }) => (
    <div>{mode === 'claim' ? 'Evidence claim form' : 'Self-report form'}</div>
  ),
}));

const baseProps = {
  questId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  questTitle: 'Harbour restoration',
  xpAward: 50,
};

describe('QuestCompletionMethods', () => {
  it('offers code and self-report for a Native Organizer Quest without an invalid claim choice', () => {
    render(
      <QuestCompletionMethods
        {...baseProps}
        registrationMode="Native"
        sourceType="OrganizerOwned"
      />,
    );

    expect(screen.getByRole('tab', { name: /Completion code/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Self-report/ })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /Submit evidence/ })).not.toBeInTheDocument();
    expect(screen.getByText('Code completion form')).toBeInTheDocument();
  });

  it('offers evidence review and self-report for an external Quest without a code choice', () => {
    render(
      <QuestCompletionMethods
        {...baseProps}
        registrationMode="External"
        sourceType="AdminCuratedExternal"
      />,
    );

    expect(screen.getByRole('tab', { name: /Submit evidence/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Self-report/ })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /Completion code/ })).not.toBeInTheDocument();
    expect(screen.getByText('Evidence claim form')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /Self-report/ }));
    expect(screen.getByText('Self-report form')).toBeInTheDocument();
  });

  it('does not offer a code for a Native external Quest that the backend cannot verify by code', () => {
    render(
      <QuestCompletionMethods
        {...baseProps}
        registrationMode="Native"
        sourceType="AdminCuratedExternal"
      />,
    );

    expect(screen.queryByRole('tab', { name: /Completion code/ })).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Submit evidence/ })).toBeInTheDocument();
    expect(screen.getByText('Evidence claim form')).toBeInTheDocument();
  });
});
