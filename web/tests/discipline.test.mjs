import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { createServer } from 'vite';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

let server, model, api, demoRepository, ReviewCard;
before(async () => {
  server = await createServer({
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: 'custom',
  });
  model = await server.ssrLoadModule('/src/features/discipline/disciplineModel.ts');
  api = await server.ssrLoadModule('/src/features/catalog/catalogApi.ts');
  const { createDemoCatalogRepository } = await server.ssrLoadModule(
    '/src/features/catalog/catalogDemoRepository.ts',
  );
  demoRepository = createDemoCatalogRepository({ getItem: () => null, setItem() {} });
  ({ DisciplineReviewCard: ReviewCard } = await server.ssrLoadModule(
    '/src/features/discipline/DisciplineReviewCard.tsx',
  ));
});
after(async () => {
  await server?.close();
});

function review(id, recommendation, status, createdAt = null) {
  return {
    id,
    disciplineId: '42',
    completionStatus: status,
    completionYear: status === 'completed' ? 2026 : null,
    ratings: { difficulty: 3, workload: 4, interest: 5, usefulness: 4, recommendation },
    experience: '',
    advice: '',
    helpfulCount: 0,
    createdAt,
  };
}
const records = [
  review('1', 5, 'completed', '2026-10-01T00:00:00Z'),
  review('2', 3, 'earlier'),
  review('3', 4, 'studying'),
  review('4', 1, 'unknown'),
];

test('summary computes recommendation distribution and keeps unknown completion separate', () => {
  const summary = model.reviewSummary(records);
  assert.equal(summary.count, 4);
  assert.equal(summary.averages.recommendation, 3.25);
  assert.equal(summary.recommendedPercent, 50);
  assert.deepEqual(
    summary.distribution.map((value) => value.count),
    [1, 1, 1, 0, 1],
  );
  assert.equal(summary.completed, 2);
  assert.equal(summary.studying, 1);
  assert.equal(summary.unknown, 1);
  const empty = model.reviewSummary([]);
  assert.equal(empty.averages.recommendation, null);
  assert.equal(empty.recommendedPercent, null);
  assert.equal(empty.latest, null);
});

test('year labels preserve the distinction between earlier, ongoing and unknown', () => {
  assert.equal(model.completionLabel(records[0]), 'Пройден в 2025/26');
  assert.equal(model.completionLabel(records[1]), 'Пройден раньше');
  assert.equal(model.completionLabel(records[2]), 'Сейчас на курсе');
  assert.equal(model.completionLabel(records[3]), 'Год прохождения не указан');
});

test('review audience and sorting work without modifying source data', () => {
  const source = records.map((value) => ({ ...value }));
  assert.deepEqual(
    model.selectReviews(source, 'completed', 'highest').map((value) => value.id),
    ['1', '2'],
  );
  assert.deepEqual(
    model.selectReviews(source, 'studying', 'newest').map((value) => value.id),
    ['3'],
  );
  assert.deepEqual(
    model.selectReviews(source, 'all', 'lowest').map((value) => value.id),
    ['4', '2', '3', '1'],
  );
  assert.equal(model.selectReviews(source, 'all', 'helpful', ['3'])[0].id, '3');
  assert.deepEqual(
    source.map((value) => value.id),
    ['1', '2', '3', '4'],
  );
  const dates = [
    review('a', 5, 'unknown', '2026-10-01T01:00:00+03:00'),
    review('b', 5, 'unknown', '2026-09-30T23:00:00Z'),
  ];
  assert.equal(model.selectReviews(dates, 'all', 'newest')[0].id, 'b');
  assert.equal(model.reviewSummary(dates).latest, dates[1].createdAt);
});

test('advice uses original responses, omits blanks and repeated answers', () => {
  assert.deepEqual(
    model
      .adviceReviews(
        records.map((value, index) => ({
          ...value,
          advice: ['Совет', '  Совет  ', '', 'Второй совет'][index],
        })),
      )
      .map((value) => value.id),
    ['1', '4'],
  );
});

const dto = {
  id: 7,
  completion_year: null,
  difficulty_rating: 3,
  workload_rating: 4,
  interest_rating: 5,
  usefulness_rating: 5,
  recommendation_rating: 4,
  experience_text: null,
  selection_advice: 'Повторить основы',
  created_at: '2026-10-01T00:00:00Z',
};
test('published review DTO preserves five ratings, dates and nullable completion metadata', () => {
  const decoded = api.decodePublishedReview(dto, '42');
  assert.equal(decoded.completionStatus, 'unknown');
  assert.equal(decoded.completionYear, null);
  assert.equal(decoded.helpfulCount, null);
  assert.equal(decoded.experience, '');
  assert.equal(decoded.advice, dto.selection_advice);
  assert.equal(decoded.ratings.recommendation, 4);
  assert.equal(
    api.decodePublishedReview({ ...dto, completion_year: 2026 }, '42').completionStatus,
    'completed',
  );
  assert.equal(
    api.decodePublishedReview({ ...dto, completion_status: 'studying' }, '42').completionStatus,
    'studying',
  );
  for (const change of [
    { difficulty_rating: 3.5 },
    { completion_status: 'invented' },
    { completion_year: 2026.5 },
    { created_at: 'invalid' },
    { helpful_count: -1 },
  ])
    assert.throws(() => api.decodePublishedReview({ ...dto, ...change }, '42'));
});

test('detail reviews use the existing endpoint with credentials and cancellation', async () => {
  const controller = new AbortController();
  const repository = api.createApiCatalogRepository({
    fetcher: async (url, init) => {
      assert.equal(url, '/minors/42/reviews');
      assert.equal(init.credentials, 'include');
      assert.equal(init.signal, controller.signal);
      return new Response(JSON.stringify({ items: [dto] }), { status: 200 });
    },
  });
  assert.equal(
    (await repository.listPublishedReviews('42', controller.signal))[0].advice,
    dto.selection_advice,
  );
});

test('demo catalog ratings and counts agree with the detail review dataset for every discipline', async () => {
  const items = await demoRepository.listDisciplines();
  for (const item of items) {
    const reviews = await demoRepository.listPublishedReviews(item.id);
    const summary = model.reviewSummary(reviews);
    assert.equal(item.reviewCount, summary.count);
    assert.equal(item.rating, Number(summary.averages.recommendation.toFixed(1)));
    assert.equal(new Set(reviews.map((value) => value.id)).size, reviews.length);
  }
  assert.deepEqual(await demoRepository.listPublishedReviews('missing'), []);
});

test('review card shows survey criteria and advice even when experience is empty', () => {
  const html = renderToStaticMarkup(
    createElement(ReviewCard, {
      review: { ...records[0], advice: 'Проверить расписание' },
      voted: false,
      votingEnabled: true,
      onVote() {},
    }),
  );
  for (const label of [
    'Сложность',
    'Нагрузка',
    'Интерес',
    'Польза',
    'Проверить расписание',
    '5/5',
    'Пройден в 2025/26',
  ])
    assert.ok(html.includes(label));
  assert.match(html, /aria-pressed="false"/);
});
