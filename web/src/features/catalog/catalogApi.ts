import { ApiContractError, createJsonClient, type ApiOptions } from '../../shared/api/client';
import {
  CATALOG_DIRECTIONS,
  type Discipline,
  type ReviewExcerpt,
  type ReviewInput,
  type UserReview,
} from './catalogTypes';
import type { CatalogRepository } from './catalogRepository';
import type { PublishedReview, CompletionStatus } from '../discipline/disciplineTypes';

type JsonRecord = Record<string, unknown>;
function record(value: unknown): JsonRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new ApiContractError('Expected an object');
  return value as JsonRecord;
}
function text(value: unknown, field: string): string {
  if (typeof value !== 'string') throw new ApiContractError(`Invalid ${field}`);
  return value;
}
function number(value: unknown, field: string, min: number, max = Number.MAX_SAFE_INTEGER): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max)
    throw new ApiContractError(`Invalid ${field}`);
  return value;
}
function id(value: unknown): string {
  const valueNumber = number(value, 'id', 1, 2147483647);
  if (!Number.isInteger(valueNumber)) throw new ApiContractError('Expected an integer id');
  return String(valueNumber);
}
function serverId(value: string): number {
  if (!/^[1-9]\d*$/.test(value)) throw new ApiContractError('Expected a numeric minor id');
  return Number(id(Number(value)));
}
function list(value: unknown): unknown[] {
  const items = record(value).items;
  if (!Array.isArray(items)) throw new ApiContractError('Expected { items: [] }');
  return items;
}
function excerpt(value: unknown): ReviewExcerpt {
  const item = record(value);
  return {
    rating: number(item.rating, 'review rating', 1, 5),
    text: text(item.text, 'review text'),
  };
}

export function decodeDiscipline(value: unknown): Discipline {
  const item = record(value);
  const direction = CATALOG_DIRECTIONS.find((entry) => entry.id === item.direction)?.id;
  if (!direction) throw new ApiContractError('Missing or unknown minor.direction');
  const count = number(item.review_count, 'review_count', 0);
  if (!Number.isInteger(count)) throw new ApiContractError('review_count must be an integer');
  return {
    id: id(item.id),
    title: text(item.name, 'name'),
    direction,
    faculty: text(item.faculty, 'faculty'),
    facultyLabel:
      item.faculty_label == null ? undefined : text(item.faculty_label, 'faculty_label'),
    rating: item.rating === null ? null : number(item.rating, 'rating', 1, 5),
    reviewCount: count,
    reviews: item.review_preview === null ? [] : [excerpt(item.review_preview)],
  };
}

function reviewStatus(value: unknown): UserReview['status'] {
  if (value === 'pending' || value === 'published' || value === 'rejected') return value;
  throw new ApiContractError('Unknown review status');
}
function reviewRatings(item: JsonRecord) {
  const ratings = {
    difficulty: number(item.difficulty_rating, 'difficulty_rating', 1, 5),
    workload: number(item.workload_rating, 'workload_rating', 1, 5),
    interest: number(item.interest_rating, 'interest_rating', 1, 5),
    usefulness: number(item.usefulness_rating, 'usefulness_rating', 1, 5),
    recommendation: number(item.recommendation_rating, 'recommendation_rating', 1, 5),
  };
  if (Object.values(ratings).some((rating) => !Number.isInteger(rating)))
    throw new ApiContractError('Review ratings must be integers');
  return ratings;
}
function decodeMyReview(value: unknown): UserReview {
  const item = record(value);
  const ratings = reviewRatings(item);
  const dates: Pick<UserReview, 'createdAt' | 'publishedAt'> = {};
  for (const [field, key] of [
    ['created_at', 'createdAt'],
    ['published_at', 'publishedAt'],
  ] as const) {
    if (!(field in item)) continue;
    const date = item[field] === null ? null : text(item[field], field);
    if (date !== null && !Number.isFinite(Date.parse(date)))
      throw new ApiContractError(`Invalid ${field}`);
    dates[key] = date;
  }
  const metadata: Pick<UserReview, 'helpfulCount' | 'moderationNote'> = {};
  if ('helpful_count' in item) {
    const count =
      item.helpful_count === null ? null : number(item.helpful_count, 'helpful_count', 0);
    if (count !== null && !Number.isInteger(count))
      throw new ApiContractError('Invalid helpful count');
    metadata.helpfulCount = count;
  }
  if ('moderation_note' in item)
    metadata.moderationNote =
      item.moderation_note === null ? null : text(item.moderation_note, 'moderation_note');
  return {
    id: id(item.id),
    disciplineId: id(item.minor_id),
    ratings,
    experience: item.experience_text == null ? '' : text(item.experience_text, 'experience_text'),
    advice: item.selection_advice == null ? '' : text(item.selection_advice, 'selection_advice'),
    status: reviewStatus(item.status),
    ...dates,
    ...metadata,
    ...('completion_year' in item || 'completion_status' in item ? reviewCompletion(item) : {}),
  };
}

function reviewCompletion(item: JsonRecord) {
  const year =
    item.completion_year == null
      ? null
      : number(item.completion_year, 'completion_year', 1900, 2200);
  if (year !== null && !Number.isInteger(year))
    throw new ApiContractError('Invalid completion year');
  const statuses: readonly CompletionStatus[] = ['completed', 'earlier', 'studying', 'unknown'];
  const completionStatus =
    item.completion_status == null
      ? year === null
        ? 'unknown'
        : 'completed'
      : statuses.find((status) => status === item.completion_status);
  if (!completionStatus) throw new ApiContractError('Unknown completion status');
  return { completionYear: year, completionStatus };
}

export function decodePublishedReview(value: unknown, disciplineId: string): PublishedReview {
  const item = record(value);
  const createdAt = item.created_at == null ? null : text(item.created_at, 'created_at');
  if (createdAt !== null && !Number.isFinite(Date.parse(createdAt)))
    throw new ApiContractError('Invalid review date');
  const helpfulCount =
    item.helpful_count == null ? null : number(item.helpful_count, 'helpful_count', 0);
  if (helpfulCount !== null && !Number.isInteger(helpfulCount))
    throw new ApiContractError('Invalid helpful count');
  return {
    id: id(item.id),
    disciplineId,
    ...reviewCompletion(item),
    ratings: reviewRatings(item),
    experience: item.experience_text == null ? '' : text(item.experience_text, 'experience_text'),
    advice: item.selection_advice == null ? '' : text(item.selection_advice, 'selection_advice'),
    createdAt,
    helpfulCount,
  };
}

export function reviewPayload(input: ReviewInput) {
  return {
    minor_id: serverId(input.disciplineId),
    completion_year: null,
    difficulty_rating: input.ratings.difficulty,
    workload_rating: input.ratings.workload,
    interest_rating: input.ratings.interest,
    usefulness_rating: input.ratings.usefulness,
    recommendation_rating: input.ratings.recommendation,
    experience_text: input.experience,
    selection_advice: input.advice,
  };
}

export function createApiCatalogRepository(options: ApiOptions = {}): CatalogRepository {
  const request = createJsonClient(options);
  return {
    listDisciplines: async (signal) =>
      list(await request('/minors', { signal })).map(decodeDiscipline),
    listReviews: async (minorId, signal) =>
      list(await request(`/minors/${serverId(minorId)}/reviews`, { signal })).map((value) => {
        const item = record(value);
        const experience =
          item.experience_text == null ? '' : text(item.experience_text, 'experience_text');
        const advice =
          item.selection_advice == null ? '' : text(item.selection_advice, 'selection_advice');
        return {
          rating: number(item.recommendation_rating, 'recommendation_rating', 1, 5),
          text: [experience, advice].filter(Boolean).join('\n\n'),
        };
      }),
    listPublishedReviews: async (minorId, signal) =>
      list(await request(`/minors/${serverId(minorId)}/reviews`, { signal })).map((value) =>
        decodePublishedReview(value, minorId),
      ),
    listFavorites: async (signal) => list(await request('/me/favorites', { signal })).map(id),
    setFavorite: async (minorId, selected) => {
      await request(`/me/favorites/${serverId(minorId)}`, { method: selected ? 'PUT' : 'DELETE' });
    },
    listMyReviews: async (signal) =>
      list(await request('/me/reviews', { signal })).map(decodeMyReview),
    createReview: async (input) => {
      const result = record(
        await request('/reviews', { method: 'POST', body: JSON.stringify(reviewPayload(input)) }),
      );
      return { ...input, id: id(result.id), status: reviewStatus(result.status) };
    },
    logout: async () => {
      await request('/auth/logout', { method: 'POST' });
    },
  };
}
