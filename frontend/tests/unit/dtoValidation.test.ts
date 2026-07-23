import { describe, it, expect } from 'vitest';
import { validateQuestDetail, validateQuestImages, validateQuestsPage } from '../../src/lib/validation/questDto';
import { validateRegionDetail, validateRegionList } from '../../src/lib/validation/regionDto';

// ── Shared valid fixtures ──────────────────────────────────────────

const validQuestImage = {
  id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  imageUrl: 'https://example.com/img.svg',
  altText: 'Test image',
  sortOrder: 0,
  isCover: true,
  creatorName: null,
  sourceUrl: null,
  licenceNote: null,
};

const validCoverImage = {
  id: validQuestImage.id,
  imageUrl: validQuestImage.imageUrl,
  altText: validQuestImage.altText,
};

const validLocationRegion = {
  id: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
  name: 'Auckland',
  type: 'AdministrativeArea',
};

const validListItem = {
  id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  title: 'Test Quest',
  description: 'A test quest.',
  category: 'RestoreNature',
  sourceType: 'OrganizerOwned',
  registrationMode: null,
  difficulty: 'Easy',
  xpAward: 50,
  capacity: null,
  startAtUtc: '2026-08-01T00:00:00.000Z',
  endAtUtc: null,
  locationRegion: null,
  locationDescription: null,
  coverImage: validCoverImage,
};

const validPage = {
  items: [validListItem],
  page: 1,
  pageSize: 12,
  totalCount: 1,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

const validDetail = {
  ...validListItem,
  externalSourceUrl: null,
  sourceCheckedAt: null,
};

const validRegion = {
  id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  name: 'Auckland',
  type: 'AdministrativeArea' as const,
  parentRegionId: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
};

// ── Region contract tests ───────────────────────────────────────────

describe('Region DTO validation', () => {
  it('accepts a valid Region payload', () => {
    expect(() => validateRegionList([validRegion])).not.toThrow();
    expect(() => validateRegionDetail(validRegion)).not.toThrow();
  });

  it('accepts a Region with null parentRegionId', () => {
    const region = { ...validRegion, parentRegionId: null };
    expect(() => validateRegionDetail(region)).not.toThrow();
  });

  it('rejects parentRegionId as arbitrary string', () => {
    const bad = { ...validRegion, parentRegionId: 'not-a-uuid' };
    expect(() => validateRegionDetail(bad)).toThrow();
  });

  it('rejects parentRegionId as number', () => {
    const bad = { ...validRegion, parentRegionId: 12345 };
    expect(() => validateRegionDetail(bad)).toThrow();
  });

  it('rejects missing parentRegionId (undefined)', () => {
    const { parentRegionId: _, ...bad } = validRegion;
    expect(() => validateRegionDetail(bad)).toThrow();
  });

  it('rejects an invalid Region enum value', () => {
    const bad = { ...validRegion, type: 'Province' };
    expect(() => validateRegionDetail(bad)).toThrow();
    expect(() => validateRegionList([bad])).toThrow();
  });

  it('rejects a removed Region enum value', () => {
    const bad = { ...validRegion, type: 'MetropolitanArea' };
    expect(() => validateRegionDetail(bad)).toThrow();
  });

  it('rejects a numeric Region type', () => {
    const bad = { ...validRegion, type: 1 };
    expect(() => validateRegionDetail(bad)).toThrow();
  });

  it('rejects a missing required Region property', () => {
    const { name: _, ...missing } = validRegion;
    expect(() => validateRegionDetail(missing)).toThrow();
  });
});

// ── Quest page contract tests ────────────────────────────────────────

describe('Quest page DTO validation', () => {
  it('accepts a valid PagedResponse<QuestListItemDto>', () => {
    expect(() => validateQuestsPage(validPage)).not.toThrow();
  });

  it('rejects an unknown QuestCategory', () => {
    const bad = {
      ...validPage,
      items: [{ ...validListItem, category: 'UnknownCategory' }],
    };
    expect(() => validateQuestsPage(bad)).toThrow();
  });

  it('rejects a removed QuestCategory', () => {
    const bad = {
      ...validPage,
      items: [{ ...validListItem, category: 'EcoTravel' }],
    };
    expect(() => validateQuestsPage(bad)).toThrow();
  });

  it('rejects a numeric QuestCategory', () => {
    const bad = {
      ...validPage,
      items: [{ ...validListItem, category: 0 }],
    };
    expect(() => validateQuestsPage(bad)).toThrow();
  });

  it('rejects a numeric registrationMode', () => {
    const bad = {
      ...validPage,
      items: [{ ...validListItem, registrationMode: 1 }],
    };
    expect(() => validateQuestsPage(bad)).toThrow();
  });

  it('rejects missing required field in QuestListItemDto', () => {
    const { title: _, ...missing } = validListItem;
    const bad = { ...validPage, items: [missing] };
    expect(() => validateQuestsPage(bad)).toThrow();
  });

  // ── Pagination integer tests ──────────────────────────────────────

  it('rejects malformed pagination (NaN page)', () => {
    const bad = { ...validPage, page: undefined };
    expect(() => validateQuestsPage(bad)).toThrow();
  });

  it('rejects malformed pagination (string pageSize)', () => {
    const bad = { ...validPage, pageSize: '12' };
    expect(() => validateQuestsPage(bad)).toThrow();
  });

  it('rejects malformed pagination (missing hasNextPage)', () => {
    const { hasNextPage: _, ...bad } = validPage;
    expect(() => validateQuestsPage(bad)).toThrow();
  });

  it('rejects malformed pagination (non-boolean hasPreviousPage)', () => {
    const bad = { ...validPage, hasPreviousPage: 1 };
    expect(() => validateQuestsPage(bad)).toThrow();
  });

  it('rejects fractional page field', () => {
    const bad = { ...validPage, page: 1.5 };
    expect(() => validateQuestsPage(bad)).toThrow();
  });

  it('rejects negative page field', () => {
    const bad = { ...validPage, page: 0 };
    expect(() => validateQuestsPage(bad)).toThrow();
  });

  it('rejects negative totalCount', () => {
    const bad = { ...validPage, totalCount: -1 };
    expect(() => validateQuestsPage(bad)).toThrow();
  });

  it('rejects pageSize above the accepted maximum', () => {
    const bad = { ...validPage, pageSize: 51 };
    expect(() => validateQuestsPage(bad)).toThrow();
  });

  it('rejects pagination values outside the C# int range', () => {
    const bad = { ...validPage, totalCount: 2_147_483_648 };
    expect(() => validateQuestsPage(bad)).toThrow();
  });

  // ── Integer field tests ───────────────────────────────────────────

  it('rejects fractional xpAward', () => {
    const bad = {
      ...validPage,
      items: [{ ...validListItem, xpAward: 50.5 }],
    };
    expect(() => validateQuestsPage(bad)).toThrow();
  });

  it('rejects fractional capacity', () => {
    const bad = {
      ...validPage,
      items: [{ ...validListItem, capacity: 10.5 }],
    };
    expect(() => validateQuestsPage(bad)).toThrow();
  });

  it('rejects NaN xpAward', () => {
    const bad = {
      ...validPage,
      items: [{ ...validListItem, xpAward: NaN }],
    };
    expect(() => validateQuestsPage(bad)).toThrow();
  });

  it('rejects negative xpAward', () => {
    const bad = {
      ...validPage,
      items: [{ ...validListItem, xpAward: -1 }],
    };
    expect(() => validateQuestsPage(bad)).toThrow();
  });

  it('rejects negative capacity', () => {
    const bad = {
      ...validPage,
      items: [{ ...validListItem, capacity: -1 }],
    };
    expect(() => validateQuestsPage(bad)).toThrow();
  });

  it('rejects Quest integers outside the C# int range', () => {
    const bad = {
      ...validPage,
      items: [{ ...validListItem, xpAward: 2_147_483_648 }],
    };
    expect(() => validateQuestsPage(bad)).toThrow();
  });

  // ── Timestamp tests ───────────────────────────────────────────────

  it('rejects arbitrary string as startAtUtc', () => {
    const bad = {
      ...validPage,
      items: [{ ...validListItem, startAtUtc: 'not-a-date' }],
    };
    expect(() => validateQuestsPage(bad)).toThrow();
  });

  it('rejects number as startAtUtc', () => {
    const bad = {
      ...validPage,
      items: [{ ...validListItem, startAtUtc: 12345 }],
    };
    expect(() => validateQuestsPage(bad)).toThrow();
  });

  it('rejects missing startAtUtc (undefined)', () => {
    const { startAtUtc: _, ...itemWithout } = validListItem;
    const bad = { ...validPage, items: [itemWithout] };
    expect(() => validateQuestsPage(bad)).toThrow();
  });

  it('accepts null startAtUtc', () => {
    const item = { ...validListItem, startAtUtc: null };
    const page = { ...validPage, items: [item] };
    expect(() => validateQuestsPage(page)).not.toThrow();
  });

  it('accepts the backend round-trip UTC timestamp format', () => {
    const item = { ...validListItem, startAtUtc: '2026-08-01T00:00:00.0000000+00:00' };
    const page = { ...validPage, items: [item] };
    expect(() => validateQuestsPage(page)).not.toThrow();
  });

  it('rejects a non-ISO parsable timestamp', () => {
    const bad = {
      ...validPage,
      items: [{ ...validListItem, startAtUtc: 'August 1, 2026 00:00:00 UTC' }],
    };
    expect(() => validateQuestsPage(bad)).toThrow();
  });

  it('rejects an impossible calendar timestamp', () => {
    const bad = {
      ...validPage,
      items: [{ ...validListItem, startAtUtc: '2026-02-30T00:00:00Z' }],
    };
    expect(() => validateQuestsPage(bad)).toThrow();
  });

  // ── Nested and collection tests ───────────────────────────────────

  it('rejects malformed nested Region in QuestListItem', () => {
    const bad = {
      ...validPage,
      items: [
        {
          ...validListItem,
          locationRegion: { ...validLocationRegion, type: 'InvalidType' },
        },
      ],
    };
    expect(() => validateQuestsPage(bad)).toThrow();
  });

  it('rejects missing locationRegion property (undefined)', () => {
    const { locationRegion: _, ...itemWithoutRegion } = validListItem;
    const bad = { ...validPage, items: [itemWithoutRegion] };
    expect(() => validateQuestsPage(bad)).toThrow();
  });

  it('rejects missing coverImage property (undefined)', () => {
    const { coverImage: _, ...itemWithoutCover } = validListItem;
    const bad = { ...validPage, items: [itemWithoutCover] };
    expect(() => validateQuestsPage(bad)).toThrow();
  });

  it('rejects missing capacity property (undefined)', () => {
    const { capacity: _, ...itemWithoutCapacity } = validListItem;
    const bad = { ...validPage, items: [itemWithoutCapacity] };
    expect(() => validateQuestsPage(bad)).toThrow();
  });

  it('rejects invalid nested QuestImage UUID', () => {
    const bad = {
      ...validPage,
      items: [{ ...validListItem, coverImage: { ...validCoverImage, id: 'not-a-uuid' } }],
    };
    expect(() => validateQuestsPage(bad)).toThrow();
  });

  it('rejects broader Region fields in the locationRegion allowlist', () => {
    const bad = {
      ...validPage,
      items: [{
        ...validListItem,
        locationRegion: { ...validLocationRegion, parentRegionId: null },
      }],
    };
    expect(() => validateQuestsPage(bad)).toThrow();
  });

  it('rejects full image metadata in the coverImage allowlist', () => {
    const bad = {
      ...validPage,
      items: [{ ...validListItem, coverImage: validQuestImage }],
    };
    expect(() => validateQuestsPage(bad)).toThrow();
  });
});

// ── Quest detail contract tests ──────────────────────────────────────

describe('Quest detail DTO validation', () => {
  it('accepts a valid QuestDetailDto', () => {
    expect(() => validateQuestDetail(validDetail)).not.toThrow();
  });

  it('rejects unapproved externalSourceStatus data', () => {
    const bad = { ...validDetail, externalSourceStatus: 'Current' };
    expect(() => validateQuestDetail(bad)).toThrow();
  });

  it('rejects malformed sourceCheckedAt timestamp', () => {
    const bad = { ...validDetail, sourceCheckedAt: 'not-a-date' };
    expect(() => validateQuestDetail(bad)).toThrow();
  });

  it('rejects missing sourceCheckedAt (undefined)', () => {
    const { sourceCheckedAt: _, ...bad } = validDetail;
    expect(() => validateQuestDetail(bad)).toThrow();
  });

  it('accepts null sourceCheckedAt', () => {
    const item = { ...validDetail, sourceCheckedAt: null };
    expect(() => validateQuestDetail(item)).not.toThrow();
  });

  it('rejects missing externalSourceUrl (undefined)', () => {
    const { externalSourceUrl: _, ...bad } = validDetail;
    expect(() => validateQuestDetail(bad)).toThrow();
  });
});

// ── Quest images contract tests ──────────────────────────────────────

describe('Quest images DTO validation', () => {
  it('accepts a valid QuestImageDto array', () => {
    expect(() => validateQuestImages([validQuestImage])).not.toThrow();
  });

  it('rejects an array with an invalid image', () => {
    const badImage = { ...validQuestImage, sortOrder: 'first' };
    expect(() => validateQuestImages([badImage])).toThrow();
  });

  it('rejects fractional sortOrder', () => {
    const badImage = { ...validQuestImage, sortOrder: 1.5 };
    expect(() => validateQuestImages([badImage])).toThrow();
  });
});
