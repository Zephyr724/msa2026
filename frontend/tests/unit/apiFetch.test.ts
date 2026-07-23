import { afterEach, describe, it, expect, vi } from 'vitest';
import { apiFetch, ApiError } from '../../src/lib/api/apiFetch.ts';
import { fetchPublishedQuests } from '../../src/lib/api/quests.ts';
import { fetchActiveLocalAreas } from '../../src/lib/api/regions.ts';

describe('apiFetch', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is a callable function', () => {
    expect(typeof apiFetch).toBe('function');
  });

  it('creates ApiError instances correctly', () => {
    const error = new ApiError(404, {
      title: 'Not Found',
      status: 404,
      detail: 'Resource not found',
    });

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(404);
    expect(error.message).toBe('Not Found');
    expect(error.problem?.detail).toBe('Resource not found');
  });

  it('constructs Region and Quest URLs with exactly one /api base segment', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        items: [],
        page: 1,
        pageSize: 12,
        totalCount: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }));
    vi.stubGlobal('fetch', fetchMock);

    await fetchActiveLocalAreas();
    await fetchPublishedQuests();

    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/v1/regions');
    expect(fetchMock.mock.calls[1]?.[0]).toBe('/api/v1/quests');
    expect(
      fetchMock.mock.calls.every((call) => !String(call[0]).includes('/api/api/')),
    ).toBe(true);
  });
});
