import { describe, expect, it } from 'vitest';
import { normalizeAccountLifecycleToken } from '../../src/lib/api/auth';

describe('normalizeAccountLifecycleToken', () => {
  it('restores plus characters converted to spaces by URLSearchParams', () => {
    expect(normalizeAccountLifecycleToken('abc def/ghi=='))
      .toBe('abc+def/ghi==');
  });

  it('leaves URL-safe tokens unchanged', () => {
    expect(normalizeAccountLifecycleToken('abc-def_ghi'))
      .toBe('abc-def_ghi');
  });
});
