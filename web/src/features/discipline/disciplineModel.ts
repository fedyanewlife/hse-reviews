import type { ReviewCriterion } from '../catalog/catalogTypes';
import type { PublishedReview, ReviewAudience, ReviewSort } from './disciplineTypes';

export const disciplineHref = (id: string) => `/disciplines/${encodeURIComponent(id)}`;
export const isCompleted = (review: PublishedReview) =>
  review.completionStatus === 'completed' || review.completionStatus === 'earlier';

export function completionLabel(
  review: Pick<PublishedReview, 'completionStatus' | 'completionYear'>,
) {
  if (review.completionStatus === 'studying') return 'Сейчас на курсе';
  if (review.completionStatus === 'earlier') return 'Пройден раньше';
  if (review.completionYear !== null) {
    const year = review.completionYear;
    return `Пройден в ${year - 1}/${String(year).slice(-2)}`;
  }
  return review.completionStatus === 'completed' ? 'Пройден' : 'Год прохождения не указан';
}

export function reviewSummary(reviews: readonly PublishedReview[]) {
  const average = (key: ReviewCriterion) =>
    reviews.length
      ? reviews.reduce((sum, review) => sum + review.ratings[key], 0) / reviews.length
      : null;
  const completed = reviews.filter(isCompleted).length;
  const studying = reviews.filter((review) => review.completionStatus === 'studying').length;
  const dates = reviews
    .flatMap((review) => (review.createdAt ? [review.createdAt] : []))
    .sort((a, b) => Date.parse(a) - Date.parse(b));
  return {
    count: reviews.length,
    averages: {
      difficulty: average('difficulty'),
      workload: average('workload'),
      interest: average('interest'),
      usefulness: average('usefulness'),
      recommendation: average('recommendation'),
    },
    recommendedPercent: reviews.length
      ? Math.round(
          (100 * reviews.filter((review) => review.ratings.recommendation >= 4).length) /
            reviews.length,
        )
      : null,
    distribution: [5, 4, 3, 2, 1].map((rating) => ({
      rating,
      count: reviews.filter((review) => review.ratings.recommendation === rating).length,
    })),
    completed,
    studying,
    unknown: reviews.length - completed - studying,
    latest: dates.at(-1) ?? null,
  };
}

export function selectReviews(
  reviews: readonly PublishedReview[],
  audience: ReviewAudience,
  sort: ReviewSort,
  votes: readonly string[] = [],
) {
  return reviews
    .filter(
      (review) =>
        audience === 'all' ||
        (audience === 'completed' ? isCompleted(review) : review.completionStatus === 'studying'),
    )
    .sort((a, b) => {
      const dateOrder =
        (b.createdAt ? Date.parse(b.createdAt) : -Infinity) -
          (a.createdAt ? Date.parse(a.createdAt) : -Infinity) || a.id.localeCompare(b.id);
      if (sort === 'helpful')
        return (
          (b.helpfulCount ?? 0) +
            Number(votes.includes(b.id)) -
            ((a.helpfulCount ?? 0) + Number(votes.includes(a.id))) || dateOrder
        );
      if (sort === 'highest')
        return b.ratings.recommendation - a.ratings.recommendation || dateOrder;
      if (sort === 'lowest')
        return a.ratings.recommendation - b.ratings.recommendation || dateOrder;
      return dateOrder;
    });
}

export function adviceReviews(reviews: readonly PublishedReview[]) {
  const seen = new Set<string>();
  return reviews
    .filter((review) => {
      const text = review.advice.trim();
      if (!text || seen.has(text)) return false;
      seen.add(text);
      return true;
    })
    .slice(0, 4);
}
