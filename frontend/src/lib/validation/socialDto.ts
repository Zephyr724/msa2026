import type {
  SocialCommentPage,
  SocialCommentReplyDto,
  SocialCommentThreadDto,
  SocialLikeDto,
  SocialPostDto,
  SocialPostPage,
} from '../../types/social';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requiredString(value: unknown, name: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Invalid social response: ${name}.`);
  }
  return value;
}

function nullableString(value: unknown, name: string): string | null {
  if (value === null) return null;
  return requiredString(value, name);
}

function nonNegativeInteger(value: unknown, name: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new Error(`Invalid social response: ${name}.`);
  }
  return value;
}

function booleanValue(value: unknown, name: string): boolean {
  if (typeof value !== 'boolean') {
    throw new Error(`Invalid social response: ${name}.`);
  }
  return value;
}

function validatePageShape<T>(
  value: unknown,
  validateItem: (item: unknown) => T,
): {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
} {
  if (!isRecord(value) || !Array.isArray(value.items)) {
    throw new Error('Invalid social paged response.');
  }
  return {
    items: value.items.map(validateItem),
    page: nonNegativeInteger(value.page, 'page'),
    pageSize: nonNegativeInteger(value.pageSize, 'pageSize'),
    totalCount: nonNegativeInteger(value.totalCount, 'totalCount'),
    totalPages: nonNegativeInteger(value.totalPages, 'totalPages'),
    hasNextPage: booleanValue(value.hasNextPage, 'hasNextPage'),
    hasPreviousPage: booleanValue(value.hasPreviousPage, 'hasPreviousPage'),
  };
}

export function validateSocialPost(value: unknown): SocialPostDto {
  if (!isRecord(value) || !Array.isArray(value.images) || !Array.isArray(value.tags)) {
    throw new Error('Invalid social post response.');
  }
  const quest = value.quest === null ? null : validateQuest(value.quest);
  return {
    id: requiredString(value.id, 'post id'),
    title: requiredString(value.title, 'post title'),
    content: requiredString(value.content, 'post content'),
    images: value.images.map(validateImage),
    tags: value.tags.map((tag) => requiredString(tag, 'post tag')),
    quest,
    authorDisplayName: requiredString(value.authorDisplayName, 'author display name'),
    createdAtUtc: requiredString(value.createdAtUtc, 'created timestamp'),
    updatedAtUtc: requiredString(value.updatedAtUtc, 'updated timestamp'),
    likeCount: nonNegativeInteger(value.likeCount, 'like count'),
    commentCount: nonNegativeInteger(value.commentCount, 'comment count'),
    isLikedByViewer: booleanValue(value.isLikedByViewer, 'viewer like state'),
    canDelete: booleanValue(value.canDelete, 'post delete permission'),
    isHidden: booleanValue(value.isHidden, 'post visibility'),
  };
}

function validateImage(value: unknown): SocialPostDto['images'][number] {
  if (!isRecord(value)) throw new Error('Invalid social post image.');
  return {
    imageUrl: requiredString(value.imageUrl, 'post image URL'),
    imageAltText: requiredString(value.imageAltText, 'post image alternative text'),
    sortOrder: nonNegativeInteger(value.sortOrder, 'post image sort order'),
  };
}

function validateQuest(value: unknown): NonNullable<SocialPostDto['quest']> {
  if (!isRecord(value)) throw new Error('Invalid related Quest.');
  return {
    id: requiredString(value.id, 'Quest id'),
    title: requiredString(value.title, 'Quest title'),
    coverImageUrl: nullableString(value.coverImageUrl, 'Quest cover image URL'),
    locationDescription: nullableString(value.locationDescription, 'Quest location'),
    startAtUtc: nullableString(value.startAtUtc, 'Quest start timestamp'),
  };
}

function validateReply(value: unknown): SocialCommentReplyDto {
  if (!isRecord(value)) throw new Error('Invalid social comment reply.');
  return {
    id: requiredString(value.id, 'reply id'),
    postId: requiredString(value.postId, 'reply post id'),
    parentCommentId: requiredString(value.parentCommentId, 'reply parent id'),
    content: requiredString(value.content, 'reply content'),
    authorDisplayName: requiredString(value.authorDisplayName, 'reply author'),
    createdAtUtc: requiredString(value.createdAtUtc, 'reply timestamp'),
    canEdit: booleanValue(value.canEdit, 'reply edit permission'),
  };
}

function validateThread(value: unknown): SocialCommentThreadDto {
  if (!isRecord(value) || !Array.isArray(value.replies)) {
    throw new Error('Invalid social comment thread.');
  }
  return {
    id: requiredString(value.id, 'comment id'),
    postId: requiredString(value.postId, 'comment post id'),
    content: requiredString(value.content, 'comment content'),
    authorDisplayName: requiredString(value.authorDisplayName, 'comment author'),
    createdAtUtc: requiredString(value.createdAtUtc, 'comment timestamp'),
    canEdit: booleanValue(value.canEdit, 'comment edit permission'),
    replies: value.replies.map(validateReply),
    replyCount: nonNegativeInteger(value.replyCount, 'comment reply count'),
    hasMoreReplies: booleanValue(value.hasMoreReplies, 'comment more replies state'),
  };
}

export function validateSocialPostPage(value: unknown): SocialPostPage {
  return validatePageShape(value, validateSocialPost);
}

export function validateSocialCommentPage(value: unknown): SocialCommentPage {
  return validatePageShape(value, validateThread);
}

export function validateSocialLike(value: unknown): SocialLikeDto {
  if (!isRecord(value)) throw new Error('Invalid social like response.');
  return {
    likeCount: nonNegativeInteger(value.likeCount, 'like count'),
    isLikedByViewer: booleanValue(value.isLikedByViewer, 'viewer like state'),
  };
}
