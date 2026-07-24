import { afterEach, describe, it, expect, vi } from 'vitest';
import {
  apiFetch,
  ApiError,
  resetCsrfToken,
} from '../../src/lib/api/apiFetch.ts';
import { fetchPublishedQuests } from '../../src/lib/api/quests.ts';
import { fetchActiveLocalAreas } from '../../src/lib/api/regions.ts';

describe('apiFetch', () => {
  afterEach(() => {
    resetCsrfToken();
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

  it('acquires and caches a CSRF token for state-changing requests', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ token: 'csrf-one' }))
      .mockResolvedValueOnce(jsonResponse({ ok: true }))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    await apiFetch('/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'member@example.test' }),
    });
    await apiFetch('/v1/auth/logout', { method: 'POST' });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/v1/auth/csrf-token');
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ credentials: 'include' });
    expect(fetchMock.mock.calls[1]?.[0]).toBe('/api/v1/auth/login');
    expect(headerValue(fetchMock.mock.calls[1]?.[1], 'X-CSRF-TOKEN')).toBe('csrf-one');
    expect(headerValue(fetchMock.mock.calls[2]?.[1], 'X-CSRF-TOKEN')).toBe('csrf-one');
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({ credentials: 'include' });
  });

  it('refreshes and retries exactly once for the explicit CSRF failure', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ token: 'csrf-one' }))
      .mockResolvedValueOnce(jsonResponse({
        type: 'https://kiwimpact.app/problems/invalid-csrf-token',
        title: 'Invalid antiforgery token',
      }, 400))
      .mockResolvedValueOnce(jsonResponse({ token: 'csrf-two' }))
      .mockResolvedValueOnce(jsonResponse({ userId: 'user-1' }));
    vi.stubGlobal('fetch', fetchMock);

    await apiFetch('/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'member@example.test' }),
    });

    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(headerValue(fetchMock.mock.calls[1]?.[1], 'X-CSRF-TOKEN')).toBe('csrf-one');
    expect(headerValue(fetchMock.mock.calls[3]?.[1], 'X-CSRF-TOKEN')).toBe('csrf-two');
  });

  it('stops after one CSRF retry and does not retry arbitrary failures', async () => {
    const csrfFailure = {
      type: 'https://kiwimpact.app/problems/invalid-csrf-token',
      title: 'Invalid antiforgery token',
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ token: 'csrf-one' }))
      .mockResolvedValueOnce(jsonResponse(csrfFailure, 400))
      .mockResolvedValueOnce(jsonResponse({ token: 'csrf-two' }))
      .mockResolvedValueOnce(jsonResponse(csrfFailure, 400));
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiFetch('/v1/auth/logout', { method: 'POST' }))
      .rejects.toMatchObject({ status: 400 });
    expect(fetchMock).toHaveBeenCalledTimes(4);

    resetCsrfToken();
    fetchMock.mockReset()
      .mockResolvedValueOnce(jsonResponse({ token: 'csrf-three' }))
      .mockResolvedValueOnce(jsonResponse({ title: 'Invalid credentials' }, 401));

    await expect(apiFetch('/v1/auth/login', {
      method: 'POST',
      body: '{}',
    })).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function headerValue(init: RequestInit | undefined, name: string): string | null {
  return new Headers(init?.headers).get(name);
}
