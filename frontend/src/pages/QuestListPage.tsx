import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import QuestCard from '../components/quest/QuestCard.tsx';
import { QuestMap } from '../components/maps/QuestMap.tsx';
import { CATEGORY_PRESENTATION } from '../lib/questPresentation.ts';
import { useQuestList } from '../hooks/useQuests.ts';
import { useRegions } from '../hooks/useRegions.ts';
import type { QuestFilters } from '../lib/api/quests.ts';
import {
  QUEST_CATEGORIES,
  QUEST_DIFFICULTIES,
  QUEST_SOURCE_TYPES,
} from '../types/quest.ts';

const SORT_OPTIONS = [
  { value: 'startAt', label: 'Soonest' },
  { value: 'createdAt', label: 'Newest' },
  { value: 'title', label: 'Title' },
];

const PAGE_SIZE_OPTIONS = [12, 24, 48] as const;

function parseFiltersFromParams(sp: URLSearchParams): QuestFilters {
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

  useEffect(() => {
    setSearchInput(filters.search ?? '');
  }, [filters.search]);

  const { data, isLoading, isError, refetch } = useQuestList(filters);
  const { data: regions } = useRegions();

  const updateFilters = useCallback((patch: Partial<QuestFilters>) => {
    const next = {
      ...parseFiltersFromParams(searchParams),
      ...patch,
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
    <div className="min-h-[calc(100vh-4rem)] bg-base-200 py-10 sm:py-14">
      <main className="kiwi-page">
        <header className="max-w-2xl">
          <p className="kiwi-stat-label">Find your next local action</p>
          <h1 className="mt-2 text-4xl sm:text-5xl">Discover eco quests</h1>
          <p className="mt-3 text-lg text-base-content/62">
            Explore practical ways to help around Auckland and across New Zealand.
          </p>
        </header>

        <section aria-label="Quest discovery controls" className="mt-9">
          <form className="grid gap-3 lg:grid-cols-[1fr_auto_auto]" onSubmit={handleSearch}>
            <label className="input input-bordered flex h-12 w-full items-center gap-3 rounded-2xl bg-base-100">
              <Search aria-hidden="true" className="size-5 text-base-content/45" />
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
              className="btn btn-outline h-12 rounded-2xl"
              onClick={() => setShowFilters((visible) => !visible)}
              type="button"
            >
              <SlidersHorizontal aria-hidden="true" className="size-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="badge badge-primary badge-sm">{activeFilterCount}</span>
              )}
            </button>
            <button className="btn btn-primary h-12 rounded-2xl px-6" type="submit">
              Search
            </button>
          </form>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
            <button
              className={`btn btn-sm shrink-0 rounded-full ${
                !filters.category ? 'btn-primary' : 'btn-outline'
              }`}
              onClick={() => updateFilters({ category: undefined })}
              type="button"
            >
              All
            </button>
            {QUEST_CATEGORIES.map((category) => {
              const presentation = CATEGORY_PRESENTATION[category];
              const Icon = presentation.Icon;
              return (
                <button
                  className={`btn btn-sm shrink-0 rounded-full ${
                    filters.category === category ? 'btn-primary' : 'btn-outline'
                  }`}
                  key={category}
                  onClick={() => updateFilters({ category })}
                  type="button"
                >
                  <Icon aria-hidden="true" className="size-3.5" />
                  {presentation.label}
                </button>
              );
            })}
          </div>

          {showFilters && (
            <div className="kiwi-panel mt-3 grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-5">
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
                label="Region"
                onChange={(value) => updateFilters({ regionId: value || undefined })}
                value={filters.regionId ?? ''}
              >
                <option value="">All regions</option>
                {regions?.map((region) => (
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
                  className="btn btn-ghost btn-sm justify-self-start sm:col-span-2 lg:col-span-5"
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

        <div className="mt-8 flex items-center justify-between gap-4">
          <p className="text-sm font-semibold text-base-content/62" aria-live="polite">
            {data ? `${data.totalCount} quest${data.totalCount === 1 ? '' : 's'} found` : 'Finding quests…'}
          </p>
          {!showFilters && (
            <label className="flex items-center gap-2 text-sm">
              <span className="text-base-content/55">Sort</span>
              <select
                aria-label="Sort by"
                className="select select-bordered select-sm rounded-xl bg-base-100"
                onChange={(event) => updateFilters({ sortBy: event.target.value })}
                value={filters.sortBy ?? 'startAt'}
              >
                {SORT_OPTIONS.map((sort) => (
                  <option key={sort.value} value={sort.value}>{sort.label}</option>
                ))}
              </select>
            </label>
          )}
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
              <p className="mt-1 text-sm text-base-content/62">
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
            <p className="mt-2 text-base-content/60">Try a broader search or clear the filters.</p>
            <button className="btn btn-primary btn-sm mt-5" onClick={clearFilters} type="button">
              Clear all filters
            </button>
          </div>
        )}

        {data && data.items.length > 0 && (
          <>
            <section className="mt-5" aria-labelledby="quest-map-heading">
              <div className="mb-3">
                <p className="kiwi-stat-label">Explore nearby</p>
                <h2 className="mt-1 text-2xl" id="quest-map-heading">Quest map</h2>
              </div>
              <QuestMap quests={data.items} />
            </section>
            <h2 className="mt-9 text-2xl">Complete Quest list</h2>
            <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {data.items.map((quest) => (
                <QuestCard key={quest.id} quest={quest} />
              ))}
            </div>
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
