import { ApiError } from '../../shared/api/client';
import type { ReviewStatus, UserReview } from '../catalog/catalogTypes';

export const REVIEW_STATES: Record<
  ReviewStatus,
  { label: string; heading: string; description: string; eyebrow: string }
> = {
  local: {
    label: 'Сохранён в браузере',
    heading: 'Отзыв пока только у тебя',
    description:
      'Он сохранён в этом браузере. В сервис отзыв не отправлялся, другие студенты его не видят.',
    eyebrow: 'Твой отзыв сохранён',
  },
  pending: {
    label: 'На проверке',
    heading: 'Проверяем твой отзыв',
    description: 'После проверки отзыв появится на странице майнора без твоего имени и почты.',
    eyebrow: 'Отзыв на проверке',
  },
  published: {
    label: 'Опубликован',
    heading: 'Твой отзыв уже доступен студентам',
    description: 'Он опубликован анонимно на странице майнора и помогает другим принять решение.',
    eyebrow: 'Твой опыт помогает выбирать',
  },
  rejected: {
    label: 'Не опубликован',
    heading: 'Отзыв не прошёл проверку',
    description: 'Текст и оценки сохранены в твоём кабинете. Другие студенты этот отзыв не видят.',
    eyebrow: 'Отзыв не опубликован',
  },
};

export function personalReviewState(reviews: readonly UserReview[]) {
  const sorted = [...reviews].sort(
    (a, b) =>
      (b.createdAt ? Date.parse(b.createdAt) : 0) - (a.createdAt ? Date.parse(a.createdAt) : 0),
  );
  const current = sorted.find((review) => review.status !== 'rejected') ?? sorted[0] ?? null;
  return { current, history: sorted.filter((review) => review !== current) };
}

export function assertCanSubmitReview(reviews: readonly UserReview[], disciplineId: string) {
  if (reviews.some((review) => review.disciplineId !== disciplineId))
    throw new ApiError(
      409,
      'Отзыв можно оставить только об одном майноре. У тебя уже есть отзыв о другом майноре.',
    );
  if (reviews.some((review) => review.status !== 'rejected'))
    throw new ApiError(
      409,
      'У тебя уже есть отзыв об этом майноре. Второй отзыв отправить нельзя.',
    );
}

export function reviewDate(review: UserReview) {
  const date =
    review.status === 'published' && review.publishedAt ? review.publishedAt : review.createdAt;
  if (!date || !Number.isFinite(Date.parse(date))) return null;
  return {
    value: date,
    label:
      review.status === 'published' && review.publishedAt
        ? 'Опубликован'
        : review.status === 'local'
          ? 'Сохранён'
          : 'Отправлен',
    formatted: new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(date)),
  };
}
