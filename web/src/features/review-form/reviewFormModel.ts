import {
  REVIEW_CRITERIA,
  type Discipline,
  type ReviewCriterion,
  type ReviewInput,
  type UserReview,
} from '../catalog/catalogTypes';

export const reviewFormHref = (minorId?: string) =>
  `/review/new${minorId ? `?minor=${encodeURIComponent(minorId)}` : ''}`;
export const TEXT_LIMIT = 4000;
export const reviewDraftStorageKey = (demo: boolean) => `otz-review-draft:${demo ? 'demo' : 'api'}`;
export const REQUIRED_ANSWERS = 8;
export type ReviewDraft = {
  disciplineId: string;
  completion: string;
  ratings: Partial<Record<ReviewCriterion, number>>;
  experience: string;
  advice: string;
  consent: boolean;
};
export type ReviewFormErrors = Partial<
  Record<
    'disciplineId' | 'completion' | ReviewCriterion | 'experience' | 'advice' | 'consent',
    string
  >
>;

export function completionOptions(now = new Date()) {
  const year = now.getUTCFullYear() - (now.getUTCMonth() < 6 ? 1 : 0);
  return [
    ...[year, year - 1]
      .filter((value) => value >= 2025)
      .map((value) => ({
        value: `year:${value}`,
        label: `Пройден в ${value - 1}/${String(value).slice(-2)}`,
      })),
    { value: 'earlier', label: 'Пройден раньше' },
    { value: 'studying', label: 'Сейчас на курсе' },
  ];
}

export function emptyDraft(): ReviewDraft {
  return {
    disciplineId: '',
    completion: '',
    ratings: {},
    experience: '',
    advice: '',
    consent: false,
  };
}

export function reviewDraft(review: UserReview): ReviewDraft {
  return {
    disciplineId: review.disciplineId,
    completion:
      review.completionStatus === 'completed' && review.completionYear
        ? `year:${review.completionYear}`
        : review.completionStatus === 'earlier' || review.completionStatus === 'studying'
          ? review.completionStatus
          : '',
    ratings: { ...review.ratings },
    experience: review.experience,
    advice: review.advice,
    consent: false,
  };
}

/** Browser drafts contain form fields only; account status and consent cannot be restored. */
export function restoreDraft(raw: string | null): ReviewDraft | null {
  try {
    const value: unknown = JSON.parse(raw ?? 'null');
    if (!value || typeof value !== 'object') return null;
    const draft = value as Partial<ReviewDraft>;
    const ratings: ReviewDraft['ratings'] = {};
    REVIEW_CRITERIA.forEach(({ key }) => {
      const rating = draft.ratings?.[key];
      if (typeof rating === 'number' && Number.isInteger(rating) && rating >= 1 && rating <= 5)
        ratings[key] = rating;
    });
    return {
      disciplineId: typeof draft.disciplineId === 'string' ? draft.disciplineId : '',
      completion: typeof draft.completion === 'string' ? draft.completion : '',
      ratings,
      experience: typeof draft.experience === 'string' ? draft.experience.slice(0, TEXT_LIMIT) : '',
      advice: typeof draft.advice === 'string' ? draft.advice.slice(0, TEXT_LIMIT) : '',
      consent: false,
    };
  } catch {
    return null;
  }
}

export function initialDraft(
  items: readonly Discipline[],
  requested: string | null,
  previous: UserReview | null,
  stored: ReviewDraft | null,
): ReviewDraft {
  const known = (id: string | null) => items.some((item) => item.id === id);
  const target =
    previous?.disciplineId ??
    (known(requested)
      ? requested
      : known(stored?.disciplineId ?? null)
        ? stored!.disciplineId
        : '');
  if (stored?.disciplineId === target) return { ...stored, consent: false };
  if (previous) return reviewDraft(previous);
  return { ...emptyDraft(), disciplineId: target ?? '' };
}

export function validateReviewDraft(
  draft: ReviewDraft,
  items: readonly Discipline[],
  completions: readonly { value: string }[],
): ReviewFormErrors {
  const errors: ReviewFormErrors = {};
  if (!items.some((item) => item.id === draft.disciplineId))
    errors.disciplineId = 'Выбери майнор, о котором хочешь рассказать.';
  if (!completions.some((option) => option.value === draft.completion))
    errors.completion = 'Укажи, когда проходил майнор.';
  REVIEW_CRITERIA.forEach(({ key }) => {
    const rating = draft.ratings[key];
    if (!rating || !Number.isInteger(rating) || rating < 1 || rating > 5)
      errors[key] = 'Выбери оценку от 1 до 5.';
  });
  if (draft.experience.length > TEXT_LIMIT)
    errors.experience = `Сократи текст до ${TEXT_LIMIT} символов.`;
  if (draft.advice.length > TEXT_LIMIT) errors.advice = `Сократи текст до ${TEXT_LIMIT} символов.`;
  if (!draft.consent) errors.consent = 'Подтверди согласие на анонимную публикацию отзыва.';
  return errors;
}

export function completedAnswers(
  draft: ReviewDraft,
  items: readonly Discipline[],
  completions: readonly { value: string }[],
) {
  const errors = validateReviewDraft(draft, items, completions);
  return (
    REQUIRED_ANSWERS -
    ['disciplineId', 'completion', ...REVIEW_CRITERIA.map(({ key }) => key), 'consent'].filter(
      (key) => key in errors,
    ).length
  );
}

/** Call after validation; empty ratings must never become zero in a POST. */
export function reviewInput(draft: ReviewDraft): ReviewInput {
  return {
    disciplineId: draft.disciplineId,
    completionStatus: draft.completion.startsWith('year:')
      ? 'completed'
      : draft.completion === 'earlier'
        ? 'earlier'
        : 'studying',
    completionYear: draft.completion.startsWith('year:') ? Number(draft.completion.slice(5)) : null,
    ratings: Object.fromEntries(
      REVIEW_CRITERIA.map(({ key }) => [key, draft.ratings[key]]),
    ) as Record<ReviewCriterion, number>,
    experience: draft.experience.trim(),
    advice: draft.advice.trim(),
  };
}
