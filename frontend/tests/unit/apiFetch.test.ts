import { describe, it, expect } from 'vitest';
import { apiFetch, ApiError } from '../../src/lib/api/apiFetch.ts';

describe('apiFetch', () => {
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
});