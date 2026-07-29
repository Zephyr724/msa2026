import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AchievementsSection from '../../src/components/passport/AchievementsSection.tsx';
import PassportPage from '../../src/pages/PassportPage.tsx';
import { authQueryKey } from '../../src/hooks/useAuth.ts';
import { createTestQueryClient, jsonResponse } from '../organizerTestUtils.tsx';

const catalog = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    code: 'verified-completions-1',
    name: 'First Steps',
    description: 'Complete one verified quest.',
    iconUrl: null,
    category: 'Milestone',
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    code: 'verified-completions-3',
    name: 'Building Momentum',
    description: 'Complete three verified quests.',
    iconUrl: null,
    category: 'Milestone',
  },
  {
    id: '55555555-5555-4555-8555-555555555555',
    code: 'verified-completions-5',
    name: 'Committed Contributor',
    description: 'Complete five verified quests.',
    iconUrl: null,
    category: 'Milestone',
  },
];

const earned = {
  achievementId: catalog[0]!.id,
  code: catalog[0]!.code,
  name: catalog[0]!.name,
  description: catalog[0]!.description,
  iconUrl: null,
  category: catalog[0]!.category,
  awardedAt: '2026-07-26T01:23:45.0000000Z',
};

type ResponseFactory = () => Promise<Response>;

function stubAchievementApi({
  catalogResponse = () => Promise.resolve(jsonResponse(catalog)),
  earnedResponse = () => Promise.resolve(jsonResponse([earned])),
  includePassport = false,
}: {
  catalogResponse?: ResponseFactory;
  earnedResponse?: ResponseFactory;
  includePassport?: boolean;
} = {}) {
  const fetchMock = vi.fn((input: RequestInfo | URL): Promise<Response> => {
    const url = String(input);
    if (url.endsWith('/v1/achievements')) return catalogResponse();
    if (url.endsWith('/v1/users/me/achievements')) return earnedResponse();
    if (includePassport && url.endsWith('/v1/users/me/progression')) {
      return Promise.resolve(jsonResponse({
        totalXp: 120,
        level: 3,
        rankTitle: 'Novice',
      }));
    }
    if (includePassport && url.includes('/v1/users/me/passport/completions')) {
      return Promise.resolve(jsonResponse({
        items: [],
        page: 1,
        pageSize: 12,
        totalCount: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      }));
    }
    return Promise.resolve(jsonResponse({ detail: 'Unexpected request.' }, 500));
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function renderSection() {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AchievementsSection />
    </QueryClientProvider>,
  );
}

function achievementsRegion() {
  return screen.getByRole('region', { name: 'Achievements' });
}

describe('Passport achievements section', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders one unlocked and two locked slots with only the unlocked date', async () => {
    stubAchievementApi();
    const { container } = renderSection();

    expect(await screen.findAllByText('Unlocked')).toHaveLength(1);
    expect(screen.getAllByText('Locked')).toHaveLength(2);
    const time = container.querySelector('time');
    expect(time).toHaveAttribute('dateTime', earned.awardedAt);
    expect(screen.getByText(/Unlocked \d/)).toBeInTheDocument();
    expect(container.querySelectorAll('time')).toHaveLength(1);
  });

  it('uses the earned row for every unlocked display field and keeps catalog slot order', async () => {
    const authoritativeEarned = {
      ...earned,
      code: 'server-current-code',
      name: 'Server Current Name',
      description: 'Server current description.',
      iconUrl: 'https://cdn.example.test/current.svg',
      category: 'ServerCurrentCategory',
    };
    stubAchievementApi({
      earnedResponse: () => Promise.resolve(jsonResponse([
        {
          ...earned,
          achievementId: catalog[2]!.id,
          name: 'Third Earned Name',
        },
        authoritativeEarned,
      ])),
    });
    const { container } = renderSection();

    expect(await screen.findByText(authoritativeEarned.name)).toBeInTheDocument();
    expect(screen.getByText(authoritativeEarned.description)).toBeInTheDocument();
    expect(screen.getByText(authoritativeEarned.category)).toBeInTheDocument();
    expect(screen.queryByText(catalog[0]!.name)).not.toBeInTheDocument();
    expect(container.querySelector('img'))
      .toHaveAttribute('src', 'https://cdn.example.test/current.svg');

    const cards = within(achievementsRegion()).getAllByRole('listitem');
    expect(cards[0]).toHaveTextContent(authoritativeEarned.name);
    expect(cards[2]).toHaveTextContent('Third Earned Name');
  });

  it('does not render earned rows without an active catalog slot', async () => {
    stubAchievementApi({
      earnedResponse: () => Promise.resolve(jsonResponse([
        earned,
        {
          ...earned,
          achievementId: '99999999-9999-4999-8999-999999999999',
          name: 'Inactive historical award',
        },
      ])),
    });
    renderSection();

    expect(await screen.findAllByRole('listitem')).toHaveLength(3);
    expect(screen.queryByText('Inactive historical award')).not.toBeInTheDocument();
  });

  it('uses the fallback icon for unknown or unsafe icons and a guarded HTTPS image', async () => {
    stubAchievementApi({
      catalogResponse: () => Promise.resolve(jsonResponse([
        { ...catalog[0], code: 'future-code', iconUrl: null },
        { ...catalog[1], iconUrl: 'javascript:alert(1)' },
        { ...catalog[2], iconUrl: 'https://cdn.example.test/medal.svg' },
      ])),
      earnedResponse: () => Promise.resolve(jsonResponse([])),
    });
    const { container } = renderSection();

    await screen.findByText('First Steps');
    expect(container.querySelectorAll('svg[role="img"]')).toHaveLength(2);
    expect(container.querySelectorAll('img')).toHaveLength(1);
    const lockedImage = container.querySelector('img');
    expect(lockedImage).toHaveAttribute(
      'src',
      'https://cdn.example.test/medal.svg',
    );
    expect(lockedImage).toHaveClass('opacity-40');
  });

  it('renders no fabricated progress and treats earned-empty as all locked', async () => {
    stubAchievementApi({
      earnedResponse: () => Promise.resolve(jsonResponse([])),
    });
    renderSection();

    expect(await screen.findAllByText('Locked')).toHaveLength(3);
    expect(achievementsRegion()).not.toHaveTextContent(/\d+\s*\/\s*\d+/);
    expect(within(achievementsRegion()).queryByRole('progressbar'))
      .not.toBeInTheDocument();
  });

  it('shows a neutral bounded state for an empty catalog', async () => {
    stubAchievementApi({
      catalogResponse: () => Promise.resolve(jsonResponse([])),
      earnedResponse: () => Promise.resolve(jsonResponse([])),
    });
    renderSection();

    expect(await screen.findByText('No achievements available yet.'))
      .toBeInTheDocument();
    expect(within(achievementsRegion()).queryByRole('alert'))
      .not.toBeInTheDocument();
  });

  it('shows the section skeleton without blocking other Passport regions', async () => {
    stubAchievementApi({
      earnedResponse: () => new Promise<Response>(() => {}),
      includePassport: true,
    });
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(authQueryKey, {
      userId: 'user-a',
      displayName: 'Aroha',
      email: 'a@example.test',
      roles: ['Member'],
    });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <PassportPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText('20 / 65 XP toward Level 4')).toBeInTheDocument();
    expect(screen.getByText('No verified completions yet.')).toBeInTheDocument();
    expect(screen.getByText('Loading your achievements…')).toBeInTheDocument();
  });

  it('bounds a 404 to the section without offering retry', async () => {
    stubAchievementApi({
      earnedResponse: () =>
        Promise.resolve(jsonResponse({
          type: 'https://kiwimpact.app/problems/profile-not-found',
          title: 'Profile Not Found',
          status: 404,
        }, 404)),
    });
    renderSection();

    expect(await screen.findByText('Passport unavailable')).toBeInTheDocument();
    expect(within(achievementsRegion()).queryByRole('button', { name: 'Retry' }))
      .not.toBeInTheDocument();
  });

  it('does not mislabel an unrelated 404 as a missing Passport profile', async () => {
    stubAchievementApi({
      earnedResponse: () =>
        Promise.resolve(jsonResponse({ title: 'Not Found', status: 404 }, 404)),
    });
    renderSection();

    expect(await screen.findByText('We could not load this section.'))
      .toBeInTheDocument();
    expect(screen.queryByText('Passport unavailable')).not.toBeInTheDocument();
    expect(within(achievementsRegion()).getByRole('button', { name: 'Retry' }))
      .toBeInTheDocument();
  });

  it('bounds progression-not-ready to Achievements and recovers on manual retry', async () => {
    const user = userEvent.setup();
    let attempts = 0;
    const fetchMock = stubAchievementApi({
      earnedResponse: () => {
        attempts += 1;
        return Promise.resolve(attempts === 1
          ? jsonResponse({
            type: 'https://kiwimpact.app/problems/progression-not-ready',
            title: 'Progression Not Ready',
            detail: 'Internal reconciliation detail.',
          }, 503)
          : jsonResponse([earned]));
      },
      includePassport: true,
    });
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(authQueryKey, {
      userId: 'user-a',
      displayName: 'Aroha',
      email: 'a@example.test',
      roles: ['Member'],
    });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <PassportPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText(
      'Your achievements are being prepared. Try again shortly.',
    )).toBeInTheDocument();
    expect(screen.queryByText('Internal reconciliation detail.'))
      .not.toBeInTheDocument();
    expect(screen.getByText('20 / 65 XP toward Level 4')).toBeInTheDocument();
    expect(screen.getByText('No verified completions yet.')).toBeInTheDocument();

    await user.click(within(achievementsRegion()).getByRole('button', {
      name: 'Retry',
    }));
    expect(await screen.findByText('First Steps')).toBeInTheDocument();
    expect(fetchMock.mock.calls.filter(([url]) =>
      String(url).endsWith('/v1/users/me/achievements'))).toHaveLength(2);
  });

  it('uses fixed generic copy, retries the failed query, and never leaks detail', async () => {
    const user = userEvent.setup();
    let attempts = 0;
    stubAchievementApi({
      catalogResponse: () => {
        attempts += 1;
        return Promise.resolve(attempts === 1
          ? jsonResponse({
            title: 'Server error',
            detail: 'Sensitive storage detail.',
          }, 500)
          : jsonResponse(catalog));
      },
    });
    renderSection();

    expect(await screen.findByText('We could not load this section.'))
      .toBeInTheDocument();
    expect(screen.queryByText('Sensitive storage detail.')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('First Steps')).toBeInTheDocument();
  });

  it('renders exactly one generic alert when both queries fail', async () => {
    const failure = () =>
      Promise.resolve(jsonResponse({ title: 'Server error' }, 500));
    stubAchievementApi({
      catalogResponse: failure,
      earnedResponse: failure,
    });
    renderSection();

    await screen.findByText('We could not load this section.');
    expect(within(achievementsRegion()).getAllByRole('alert')).toHaveLength(1);
  });
});
