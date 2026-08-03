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
  if (!isRecord(value)) throw new Error('Invalid social post response.');
  return {
    id: requiredString(value.id, 'post id'),
    content: requiredString(value.content, 'post content'),
    imageUrl: nullableString(value.imageUrl, 'image URL'),
    imageAltText: nullableString(value.imageAltText, 'image alternative text'),
    authorDisplayName: requiredString(value.authorDisplayName, 'author display name'),
    createdAtUtc: requiredString(value.createdAtUtc, 'created timestamp'),
    updatedAtUtc: requiredString(value.updatedAtUtc, 'updated timestamp'),
    likeCount: nonNegativeInteger(value.likeCount, 'like count'),
    commentCount: nonNegativeInteger(value.commentCount, 'comment count'),
    isLikedByViewer: booleanValue(value.isLikedByViewer, 'viewer like state'),
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
