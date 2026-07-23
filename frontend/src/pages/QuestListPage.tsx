import { useState, useCallback, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuestList } from '../hooks/useQuests';
import { useRegions } from '../hooks/useRegions';
import type { QuestFilters } from '../lib/api/quests';
import type { QuestListItemDto } from '../types/quest';

const CATEGORIES = [
  'RestoreNature', 'ProtectWildlife', 'CleanReduceWaste',
  'GrowCompost', 'ObserveMeasure', 'LearnShare',
] as const;

const SOURCE_TYPES = ['OrganizerOwned', 'AdminCuratedExternal', 'PlatformEcoChallenge'] as const;

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'] as const;

const SORT_OPTIONS = [
  { value: 'startAt', label: 'Start Date' },
  { value: 'createdAt', label: 'Created' },
  { value: 'title', label: 'Title' },
];

const PAGE_SIZE_OPTIONS = [12, 24, 48] as const;
const QUEST_IMAGE_FALLBACK = '/images/quests/quest-fallback.svg';

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
  const p = new URLSearchParams();
  if (filters.page && filters.page > 1) p.set('page', String(filters.page));
  if (filters.pageSize && filters.pageSize !== 12) p.set('pageSize', String(filters.pageSize));
  if (filters.category) p.set('category', filters.category);
  if (filters.sourceType) p.set('sourceType', filters.sourceType);
  if (filters.difficulty) p.set('difficulty', filters.difficulty);
  if (filters.regionId) p.set('regionId', filters.regionId);
  if (filters.search) p.set('search', filters.search);
  if (filters.sortBy && filters.sortBy !== 'startAt') p.set('sortBy', filters.sortBy);
  if (filters.sortDirection && filters.sortDirection !== 'asc') p.set('sortDirection', filters.sortDirection);
  return p;
}

export default function QuestListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = parseFiltersFromParams(searchParams);
  const [searchInput, setSearchInput] = useState(filters.search ?? '');

  useEffect(() => {
    setSearchInput(filters.search ?? '');
  }, [filters.search]);

  const { data, isLoading, isError, refetch } = useQuestList(filters);
  const { data: regions } = useRegions();

  const updateFilters = useCallback((patch: Partial<QuestFilters>) => {
    const next = { ...parseFiltersFromParams(searchParams), ...patch, page: patch.page ?? 1 };
    setSearchParams(filtersToParams(next));
  }, [searchParams, setSearchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchInput || undefined });
  };

  const clearFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Discover Quests</h1>

      {/* Filters */}
      <form onSubmit={handleSearch} className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="form-control flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search quests..."
              className="input input-bordered w-full"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              maxLength={100}
              aria-label="Search quests"
            />
          </div>

          {/* Category */}
          <select
            className="select select-bordered"
            value={filters.category ?? ''}
            onChange={(e) => updateFilters({ category: e.target.value || undefined })}
            aria-label="Category filter"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Source Type */}
          <select
            className="select select-bordered"
            value={filters.sourceType ?? ''}
            onChange={(e) => updateFilters({ sourceType: e.target.value || undefined })}
            aria-label="Source type filter"
          >
            <option value="">All Sources</option>
            {SOURCE_TYPES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Difficulty */}
          <select
            className="select select-bordered"
            value={filters.difficulty ?? ''}
            onChange={(e) => updateFilters({ difficulty: e.target.value || undefined })}
            aria-label="Difficulty filter"
          >
            <option value="">All Difficulties</option>
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Region */}
          <select
            className="select select-bordered"
            value={filters.regionId ?? ''}
            onChange={(e) => updateFilters({ regionId: e.target.value || undefined })}
            aria-label="Region filter"
          >
            <option value="">All Regions</option>
            {regions?.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>

          {/* Sort */}
          <select
            className="select select-bordered"
            value={filters.sortBy ?? 'startAt'}
            onChange={(e) => updateFilters({ sortBy: e.target.value })}
            aria-label="Sort by"
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>Sort: {s.label}</option>
            ))}
          </select>

          {/* Page size */}
          <select
            className="select select-bordered"
            value={filters.pageSize ?? 12}
            onChange={(e) => updateFilters({ pageSize: Number(e.target.value) })}
            aria-label="Page size"
          >
            {PAGE_SIZE_OPTIONS.map((pageSize) => (
              <option key={pageSize} value={pageSize}>{pageSize} per page</option>
            ))}
          </select>

          <button type="submit" className="btn btn-primary">Search</button>
          <button type="button" className="btn btn-ghost" onClick={clearFilters}>Clear</button>
        </div>
      </form>

      {/* Content */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-64 rounded-lg" />
          ))}
        </div>
      )}

      {isError && (
        <div className="alert alert-error">
          <span>Failed to load quests.</span>
          <button className="btn btn-sm btn-ghost" onClick={() => refetch()}>Retry</button>
        </div>
      )}

      {data && data.items.length === 0 && (
        <div className="text-center py-12">
          <p className="text-lg text-base-content/60">No quests found matching your filters.</p>
          <button className="btn btn-link mt-2" onClick={clearFilters}>Clear all filters</button>
        </div>
      )}

      {data && data.items.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.items.map((quest) => (
              <QuestCard key={quest.id} quest={quest} />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-center items-center gap-4 mt-8">
            <button
              className="btn btn-outline"
              disabled={!data.hasPreviousPage}
              onClick={() => updateFilters({ page: (filters.page ?? 1) - 1 })}
            >
              Previous
            </button>
            <span className="text-sm">
              Page {data.page} of {data.totalPages}
            </span>
            <button
              className="btn btn-outline"
              disabled={!data.hasNextPage}
              onClick={() => updateFilters({ page: (filters.page ?? 1) + 1 })}
            >
              Next
            </button>
          </div>
        </>
      )}
    </main>
  );
}

function QuestCard({ quest }: { quest: QuestListItemDto }) {
  const fallbackAlt = `Fallback illustration for ${quest.title}`;
  const [imageSrc, setImageSrc] = useState(
    quest.coverImage?.imageUrl ?? QUEST_IMAGE_FALLBACK,
  );
  const isFallback = imageSrc === QUEST_IMAGE_FALLBACK;

  return (
    <Link
      to={`/quests/${quest.id}`}
      className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow"
    >
      <figure className="h-48 bg-base-200">
        <img
          src={imageSrc}
          alt={isFallback ? fallbackAlt : quest.coverImage!.altText}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setImageSrc(QUEST_IMAGE_FALLBACK)}
        />
      </figure>
      <div className="card-body p-4">
        <h2 className="card-title text-lg">{quest.title}</h2>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="badge badge-outline">{quest.category}</span>
          <span className="badge badge-outline">{quest.difficulty}</span>
          <span className="badge">{quest.xpAward} XP</span>
          <span className="badge badge-outline">
            Registration: {quest.registrationMode ?? 'Not required'}
          </span>
          <span className="badge badge-outline">Source: {quest.sourceType}</span>
        </div>
        {quest.locationRegion && (
          <p className="text-xs text-base-content/60">{quest.locationRegion.name}</p>
        )}
        {quest.startAtUtc ? (
          <time className="text-xs" dateTime={quest.startAtUtc}>
            {new Date(quest.startAtUtc).toLocaleDateString()}
          </time>
        ) : (
          <p className="text-xs">Schedule to be confirmed</p>
        )}
      </div>
    </Link>
  );
}
