import {
  ArrowUpDown,
  Grid2X2,
  Map,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import QuestCard from '../components/quest/QuestCard.tsx';
import CategoryEmblem from '../components/quest/CategoryEmblem.tsx';
import { QuestMap } from '../components/maps/QuestMap.tsx';
import {
  CATEGORY_PRESENTATION,
  questDiscoveryHighlight,
} from '../lib/questPresentation.ts';
import { useQuestList } from '../hooks/useQuests.ts';
import { useCities, useRegions } from '../hooks/useRegions.ts';
import type { QuestFilters } from '../lib/api/quests.ts';
import {
  QUEST_CATEGORIES,
  QUEST_DIFFICULTIES,
  QUEST_SOURCE_TYPES,
  type QuestListItemDto,
} from '../types/quest.ts';

const SORT_OPTIONS = [
  { value: 'startAt', label: 'Soonest' },
  { value: 'createdAt', label: 'Newest' },
  { value: 'title', label: 'Title' },
];

const PAGE_SIZE_OPTIONS = [12, 24, 48] as const;

function parseFiltersFromParams(sp: URLSearchParams): QuestFilters {
  // Discovery filters live in the URL so a filtered result can be refreshed,
  // bookmarked, or shared without a second client-side source of truth.
  const filters: QuestFilters = {};
  const page = sp.get('page');
  if (page) filters.page = Number(page);
  const pageSize = sp.get('pageSize');
  if (pageSize) filters.pageSize = Number(pageSize);
  const category = sp.get('category');
  if (category) filters.category = category;
  const sourceType = sp.get('sourceType');
  if (sourceType) filters.sourceType = sourceType;
  const difficulty = sp.get('difficulty');
  if (difficulty) filters.difficulty = difficulty;
  const regionId = sp.get('regionId');
  if (regionId) filters.regionId = regionId;
  const search = sp.get('search');
  if (search) filters.search = search;
  const sortBy = sp.get('sortBy');
  if (sortBy) filters.sortBy = sortBy;
  const sortDirection = sp.get('sortDirection');
  if (sortDirection) filters.sortDirection = sortDirection;
  return filters;
}

function filtersToParams(filters: QuestFilters): URLSearchParams {
  const params = new URLSearchParams();
  // Defaults are omitted to keep shared discovery links compact and stable.
  if (filters.page && filters.page > 1) params.set('page', String(filters.page));
  if (filters.pageSize && filters.pageSize !== 12) {
    params.set('pageSize', String(filters.pageSize));
  }
  if (filters.category) params.set('category', filters.category);
  if (filters.sourceType) params.set('sourceType', filters.sourceType);
  if (filters.difficulty) params.set('difficulty', filters.difficulty);
  if (filters.regionId) params.set('regionId', filters.regionId);
  if (filters.search) params.set('search', filters.search);
  if (filters.sortBy && filters.sortBy !== 'startAt') params.set('sortBy', filters.sortBy);
  if (filters.sortDirection && filters.sortDirection !== 'asc') {
    params.set('sortDirection', filters.sortDirection);
  }
  return params;
}

export default function QuestListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = parseFiltersFromParams(searchParams);
  const [searchInput, setSearchInput] = useState(filters.search ?? '');
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState<'cards' | 'map'>('cards');
  const [selectedMapQuestId, setSelectedMapQuestId] = useState<string | null>(null);

  useEffect(() => {
    setSearchInput(filters.search ?? '');
  }, [filters.search]);

  const { data, isLoading, isError, refetch } = useQuestList(filters);
  const { data: regions } = useRegions();
  const { data: cities } = useCities();
  const selectedCommunity = regions?.find((region) => region.id === filters.regionId);
  const selectedCityId = cities?.some((city) => city.id === filters.regionId)
    ? filters.regionId
    : selectedCommunity?.parentRegionId ?? '';
  const selectedCommunityId = selectedCommunity?.id ?? '';
  const visibleCommunities = selectedCityId
    ? regions?.filter((region) => region.parentRegionId === selectedCityId)
    : regions;

  useEffect(() => {
    if (
      selectedMapQuestId !== null
      && !data?.items.some((quest) => quest.id === selectedMapQuestId)
    ) {
      // A page or filter change can remove the selected marker; clear it so
      // the map and adjacent result list cannot point at different Quests.
      setSelectedMapQuestId(null);
    }
  }, [data?.items, selectedMapQuestId]);

  const updateFilters = useCallback((patch: Partial<QuestFilters>) => {
    const next = {
      ...parseFiltersFromParams(searchParams),
      ...patch,
      // Any filter or sort change starts from the first page unless the caller
      // is explicitly performing pagination.
      page: patch.page ?? 1,
    };
    setSearchParams(filtersToParams(next));
  }, [searchParams, setSearchParams]);

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    updateFilters({ search: searchInput.trim() || undefined });
  }

  function clearFilters() {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  }

  const activeFilterCount = [
    filters.category,
    filters.sourceType,
    filters.difficulty,
    filters.regionId,
  ].filter(Boolean).length;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-base-200 py-8">
      <main className="kiwi-page">
        <header className="max-w-2xl">
          <h1 className="kiwi-page-heading">Discover eco quests</h1>
          <p className="kiwi-page-intro mt-1">
            Explore practical ways to help around Auckland and across New Zealand.
          </p>
        </header>

        <section aria-label="Quest discovery controls" className="mt-7">
          <form className="grid grid-cols-[1fr_auto] gap-3 sm:grid-cols-[1fr_auto_auto_auto]" onSubmit={handleSearch}>
            <label className="input input-bordered flex h-11 w-full items-center gap-3 rounded-[0.875rem] bg-base-100">
              <Search aria-hidden="true" className="size-5 text-muted-content" />
              <span className="sr-only">Search quests</span>
              <input
                aria-label="Search quests"
                className="grow"
                maxLength={100}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search quests or locations…"
                type="search"
                value={searchInput}
              />
            </label>
            <button
              aria-expanded={showFilters}
              className="btn btn-outline h-11 min-h-11 rounded-[0.875rem] border-primary/45 text-primary hover:border-primary hover:bg-primary hover:text-primary-content"
              onClick={() => setShowFilters((visible) => !visible)}
              type="button"
            >
              <SlidersHorizontal aria-hidden="true" className="size-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="badge badge-primary badge-sm">{activeFilterCount}</span>
              )}
            </button>
            <label className="relative hidden sm:block">
              <ArrowUpDown
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-primary"
              />
              <span className="sr-only">Sort quests</span>
              <select
                aria-label="Sort by"
                className="select h-11 min-h-11 rounded-[0.875rem] border-primary/45 bg-base-100 pl-9 font-semibold leading-none text-base-content focus:border-primary focus:outline-primary"
                onChange={(event) => updateFilters({ sortBy: event.target.value })}
                value={filters.sortBy ?? 'startAt'}
              >
                {SORT_OPTIONS.map((sort) => (
                  <option key={sort.value} value={sort.value}>{sort.label}</option>
                ))}
              </select>
            </label>
            <div
              aria-label="Quest view"
              className="inline-flex h-11 items-center rounded-[0.875rem] border border-primary/45 bg-base-100 p-1"
              role="group"
            >
              <button
                aria-pressed={view === 'cards'}
                className={`grid size-8 place-items-center rounded-[0.65rem] transition-colors ${
                  view === 'cards' ? 'bg-primary text-primary-content' : 'text-primary hover:bg-primary/10'
                }`}
                onClick={() => setView('cards')}
                type="button"
              >
                <Grid2X2 aria-hidden="true" className="size-4" />
                <span className="sr-only">Cards</span>
              </button>
              <button
                aria-pressed={view === 'map'}
                className={`grid size-8 place-items-center rounded-[0.65rem] transition-colors ${
                  view === 'map' ? 'bg-primary text-primary-content' : 'text-primary hover:bg-primary/10'
                }`}
                onClick={() => setView('map')}
                type="button"
              >
                <Map aria-hidden="true" className="size-4" />
                <span className="sr-only">Map</span>
              </button>
            </div>
          </form>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            <button
              className={`btn btn-sm shrink-0 rounded-full border ${
                !filters.category
                  ? 'border-primary bg-primary text-primary-content'
                  : 'border-primary/45 bg-base-100 text-primary hover:border-primary hover:bg-primary/10'
              }`}
              onClick={() => updateFilters({ category: undefined })}
              type="button"
            >
              All
            </button>
            {QUEST_CATEGORIES.map((category) => {
              const presentation = CATEGORY_PRESENTATION[category];
              return (
                <button
                  className={`btn btn-xs h-8 min-h-8 shrink-0 rounded-full border px-3 ${
                    filters.category === category
                      ? presentation.tone
                      : presentation.softTone
                  }`}
                  key={category}
                  onClick={() => updateFilters({ category })}
                  type="button"
                >
                  <CategoryEmblem category={category} size="xs" />
                  {presentation.label}
                </button>
              );
            })}
          </div>

          {showFilters && (
            <div className="kiwi-panel mt-3 grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-6">
              <FilterSelect
                label="Source type"
                onChange={(value) => updateFilters({ sourceType: value || undefined })}
                value={filters.sourceType ?? ''}
              >
                <option value="">All sources</option>
                {QUEST_SOURCE_TYPES.map((source) => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </FilterSelect>
              <FilterSelect
                label="Difficulty"
                onChange={(value) => updateFilters({ difficulty: value || undefined })}
                value={filters.difficulty ?? ''}
              >
                <option value="">All difficulties</option>
                {QUEST_DIFFICULTIES.map((difficulty) => (
                  <option key={difficulty} value={difficulty}>{difficulty}</option>
                ))}
              </FilterSelect>
              <FilterSelect
                label="City"
                onChange={(value) => updateFilters({ regionId: value || undefined })}
                value={selectedCityId ?? ''}
              >
                <option value="">All cities</option>
                {cities?.map((city) => (
                  <option key={city.id} value={city.id}>{city.name}</option>
                ))}
              </FilterSelect>
              <FilterSelect
                label="Community"
                onChange={(value) => updateFilters({
                  regionId: value || selectedCityId || undefined,
                })}
                value={selectedCommunityId}
              >
                <option value="">
                  {selectedCityId ? 'All communities in city' : 'All communities'}
                </option>
                {visibleCommunities?.map((region) => (
                  <option key={region.id} value={region.id}>{region.name}</option>
                ))}
              </FilterSelect>
              <FilterSelect
                label="Sort by"
                onChange={(value) => updateFilters({ sortBy: value })}
                value={filters.sortBy ?? 'startAt'}
              >
                {SORT_OPTIONS.map((sort) => (
                  <option key={sort.value} value={sort.value}>{sort.label}</option>
                ))}
              </FilterSelect>
              <FilterSelect
                label="Page size"
                onChange={(value) => updateFilters({ pageSize: Number(value) })}
                value={String(filters.pageSize ?? 12)}
              >
                {PAGE_SIZE_OPTIONS.map((pageSize) => (
                  <option key={pageSize} value={pageSize}>{pageSize} per page</option>
                ))}
              </FilterSelect>
              {activeFilterCount > 0 && (
                <button
                  className="btn btn-ghost btn-sm justify-self-start sm:col-span-2 lg:col-span-6"
                  onClick={clearFilters}
                  type="button"
                >
                  <X aria-hidden="true" className="size-4" />
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </section>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-muted-content" aria-live="polite">
            {data ? `${data.totalCount} quest${data.totalCount === 1 ? '' : 's'} found` : 'Finding quests…'}
          </p>
        </div>

        {isLoading && (
          <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3" aria-live="polite">
            {Array.from({ length: 6 }).map((_, index) => (
              <div className="skeleton h-[30rem] rounded-[1.35rem]" key={index} />
            ))}
          </div>
        )}

        {isError && (
          <div className="kiwi-panel mt-5 flex flex-col items-start gap-4 p-6" role="alert">
            <div>
              <h2 className="text-xl">We could not load the quests</h2>
              <p className="mt-1 text-sm text-muted-content">
                Check your connection and try again.
              </p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => refetch()} type="button">
              Retry
            </button>
          </div>
        )}

        {data && data.items.length === 0 && (
          <div className="kiwi-panel mt-5 py-16 text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-secondary text-primary">
              <Search aria-hidden="true" className="size-6" />
            </span>
            <h2 className="mt-5 text-2xl">No quests match those filters</h2>
            <p className="mt-2 text-muted-content">Try a broader search or clear the filters.</p>
            <button className="btn btn-primary btn-sm mt-5" onClick={clearFilters} type="button">
              Clear all filters
            </button>
          </div>
        )}

        {data && data.items.length > 0 && (
          <>
            {view === 'map' ? (
              <section className="mt-5" aria-labelledby="quest-map-heading">
                <div className="mb-3">
                  <p className="kiwi-stat-label">Explore nearby</p>
                  <h2 className="mt-1 text-2xl" id="quest-map-heading">Quest map</h2>
                </div>
                <div className="space-y-5">
                  <QuestMap
                    onSelectQuest={setSelectedMapQuestId}
                    quests={data.items}
                    selectedQuestId={selectedMapQuestId}
                  />
                  <QuestMapResultList
                    onSelectQuest={(questId) => setSelectedMapQuestId(
                      selectedMapQuestId === questId ? null : questId,
                    )}
                    quests={data.items}
                    selectedQuestId={selectedMapQuestId}
                  />
                </div>
              </section>
            ) : (
              <div className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {data.items.map((quest) => (
                  <QuestCard
                    highlightLabel={questDiscoveryHighlight(quest)}
                    key={quest.id}
                    quest={quest}
                  />
                ))}
              </div>
            )}
            <nav
              aria-label="Quest result pages"
              className="mt-10 flex items-center justify-center gap-4"
            >
              <button
                className="btn btn-outline rounded-full"
                disabled={!data.hasPreviousPage}
                onClick={() => updateFilters({ page: (filters.page ?? 1) - 1 })}
                type="button"
              >
                Previous
              </button>
              <span className="text-sm font-semibold">
                Page {data.page} of {Math.max(data.totalPages, 1)}
              </span>
              <button
                className="btn btn-outline rounded-full"
                disabled={!data.hasNextPage}
                onClick={() => updateFilters({ page: (filters.page ?? 1) + 1 })}
                type="button"
              >
                Next
              </button>
            </nav>
          </>
        )}
      </main>
    </div>
  );
}

function QuestMapResultList({
  onSelectQuest,
  quests,
  selectedQuestId,
}: {
  onSelectQuest: (questId: string) => void;
  quests: QuestListItemDto[];
  selectedQuestId: string | null;
}) {
  return (
    <section aria-labelledby="map-results-heading">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="kiwi-stat-label">Current results</p>
          <h3 className="mt-1 text-xl" id="map-results-heading">
            Quests in this search
          </h3>
        </div>
        <span className="text-xs font-semibold text-muted-content">
          {quests.length} shown
        </span>
      </div>
      <ul aria-label="Quests shown in map view" className="space-y-2.5">
        {quests.map((quest) => {
          const hasCoordinates = typeof quest.latitude === 'number'
            && typeof quest.longitude === 'number';
          const selected = selectedQuestId === quest.id;
          return (
            <li
              className={`rounded-2xl border bg-base-100 p-3 transition-colors ${
                selected
                  ? 'border-primary bg-primary/5'
                  : 'border-base-300 hover:border-primary/35'
              }`}
              key={quest.id}
            >
              <div className="flex items-center gap-3">
                <button
                  aria-pressed={selected}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  onClick={() => onSelectQuest(quest.id)}
                  type="button"
                >
                  <CategoryEmblem category={quest.category} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold">{quest.title}</span>
                    <span className="mt-1 flex items-center gap-1.5 truncate text-xs text-muted-content">
                      <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
                      {quest.locationDescription
                        ?? quest.locationRegion?.name
                        ?? 'Location to be confirmed'}
                    </span>
                  </span>
                </button>
                <span className="hidden items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-extrabold text-amber-700 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300 sm:inline-flex">
                  <Zap aria-hidden="true" className="size-3.5" />
                  {quest.xpAward} XP
                </span>
                {!hasCoordinates && (
                  <span className="badge badge-ghost badge-sm">Not mapped</span>
                )}
                <Link
                  aria-label={`Details for ${quest.title}`}
                  className="btn btn-outline btn-sm rounded-full"
                  to={`/quests/${quest.id}`}
                >
                  Details
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function FilterSelect({
  children,
  label,
  onChange,
  value,
}: {
  children: React.ReactNode;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="form-control">
      <span className="kiwi-stat-label mb-2">{label}</span>
      <select
        aria-label={label}
        className="select select-bordered w-full rounded-xl bg-base-100"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {children}
      </select>
    </label>
  );
}
