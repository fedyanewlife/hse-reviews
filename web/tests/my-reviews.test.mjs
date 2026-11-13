import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createServer } from 'vite';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

let server, model, previews, api, makeDemo, storageModel, Page;
before(async () => {
  server = await createServer({
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: 'custom',
  });
  model = await server.ssrLoadModule('/src/features/my-reviews/myReviewModel.ts');
  previews = await server.ssrLoadModule('/src/features/my-reviews/myReviewDemo.ts');
  api = await server.ssrLoadModule('/src/features/catalog/catalogApi.ts');
  storageModel = await server.ssrLoadModule('/src/features/catalog/catalogModel.ts');
  ({ createDemoCatalogRepository: makeDemo } = await server.ssrLoadModule(
    '/src/features/catalog/catalogDemoRepository.ts',
  ));
  ({ MyReviewsPage: Page } = await server.ssrLoadModule(
    '/src/features/my-reviews/MyReviewsPage.tsx',
  ));
});
after(async () => {
  await server?.close();
});

const render = (props = {}) =>
  renderToStaticMarkup(
    createElement(Page, {
      reviews: [],
      status: 'ready',
      error: null,
      items: [],
      catalogStatus: 'ready',
      onRetry() {},
      onCatalogRetry() {},
      ...props,
    }),
  );
const json = (body) =>
  new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });
const dto = {
  id: 10,
  minor_id: 42,
  status: 'published',
  difficulty_rating: 3,
  workload_rating: 4,
  interest_rating: 5,
  usefulness_rating: 5,
  recommendation_rating: 5,
  experience_text: 'Практики достаточно',
  selection_advice: 'Оставь время на проект',
};

test('one current review is selected without discarding previous submissions or changing their order', () => {
  const base = previews.personalReviewPreview('published');
  const old = { ...base, id: 'old', createdAt: '2026-09-01T00:00:00Z' };
  const current = { ...base, id: 'current', status: 'pending', createdAt: '2026-10-01T00:00:00Z' };
  const rejected = {
    ...base,
    id: 'rejected',
    status: 'rejected',
    createdAt: '2026-11-01T00:00:00Z',
  };
  const records = [old, rejected, current];
  const result = model.personalReviewState(records);
  assert.equal(result.current.id, 'current');
  assert.deepEqual(
    result.history.map((review) => review.id),
    ['rejected', 'old'],
  );
  assert.deepEqual(
    records.map((review) => review.id),
    ['old', 'rejected', 'current'],
  );
  assert.equal(model.personalReviewState([rejected]).current.id, 'rejected');
  assert.equal(model.personalReviewState([]).current, null);
});

test('one-minor rule blocks duplicates and other minors, but allows resubmission to the same minor after rejection', () => {
  const review = previews.personalReviewPreview('published');
  for (const status of ['published', 'pending', 'local']) {
    const existing = { ...review, status };
    assert.throws(() => model.assertCanSubmitReview([existing], review.disciplineId), {
      status: 409,
    });
    assert.throws(() => model.assertCanSubmitReview([existing], 'other'), { status: 409 });
  }
  const rejected = { ...review, status: 'rejected' };
  assert.doesNotThrow(() => model.assertCanSubmitReview([rejected], review.disciplineId));
  assert.throws(() => model.assertCanSubmitReview([rejected], 'other'), { status: 409 });
  assert.doesNotThrow(() => model.assertCanSubmitReview([], review.disciplineId));
});

test('demo saves one local review and refuses a second without modifying storage', async () => {
  const data = new Map();
  const repository = makeDemo({
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
  });
  const { disciplineId, ratings, experience, advice } = previews.personalReviewPreview('published');
  const input = { disciplineId, ratings, experience, advice };
  const saved = await repository.createReview(input);
  assert.equal(saved.status, 'local');
  assert.ok(Number.isFinite(Date.parse(saved.createdAt)));
  const before = data.get(storageModel.REVIEWS_KEY);
  await assert.rejects(repository.createReview({ ...input, disciplineId: 'other' }), {
    status: 409,
  });
  await assert.rejects(repository.createReview(input), { status: 409 });
  assert.equal(data.get(storageModel.REVIEWS_KEY), before);
  assert.deepEqual(await repository.listMyReviews(), [saved]);
});

test('browser records cannot claim publication, helpful counts or moderator messages', () => {
  const malicious = {
    ...previews.personalReviewPreview('published'),
    createdAt: 'not a date',
    moderationNote: { unexpected: true },
  };
  const [safe] = storageModel.parseReviews(JSON.stringify([malicious]));
  assert.equal(safe.status, 'local');
  assert.equal(safe.createdAt, undefined);
  assert.equal(safe.publishedAt, undefined);
  assert.equal(safe.helpfulCount, undefined);
  assert.equal(safe.moderationNote, undefined);
  assert.equal(model.reviewDate(safe), null);
});

test('personal API preserves optional dates, completion and moderation metadata and rejects invalid values', async () => {
  const payload = {
    ...dto,
    completion_year: 2026,
    created_at: '2026-10-14T12:00:00Z',
    published_at: null,
    helpful_count: 0,
    moderation_note: null,
  };
  const get = (record) =>
    api
      .createApiCatalogRepository({ fetcher: async () => json({ items: [record] }) })
      .listMyReviews();
  const [review] = await get(payload);
  assert.equal(review.createdAt, payload.created_at);
  assert.equal(review.publishedAt, null);
  assert.equal(review.helpfulCount, 0);
  assert.equal(review.moderationNote, null);
  assert.equal(review.completionStatus, 'completed');
  assert.equal(review.completionYear, 2026);
  assert.equal((await get({ ...payload, completion_year: null }))[0].completionStatus, 'unknown');
  const [legacy] = await get(dto);
  assert.equal(legacy.createdAt, undefined);
  assert.equal(legacy.helpfulCount, undefined);
  for (const invalid of [
    { created_at: 'bad' },
    { published_at: {} },
    { helpful_count: -1 },
    { helpful_count: 1.5 },
    { moderation_note: 12 },
    { completion_year: 2026.5 },
    { completion_status: 'bad' },
  ]) {
    await assert.rejects(get({ ...payload, ...invalid }), { name: 'ApiContractError' });
  }
});

test('review states stay truthful, show all survey answers and never invite a second review', () => {
  for (const status of ['published', 'pending', 'rejected', 'local']) {
    const review = previews.personalReviewPreview(status);
    const html = render({ reviews: [review] });
    assert.ok(html.includes(model.REVIEW_STATES[status].label));
    assert.ok(html.includes(review.experience));
    assert.ok(html.includes(review.advice));
    assert.match(html, /Польза/);
    assert.match(html, /Пройден в 2025\/26/);
    assert.match(html, /Один пользователь — один майнор/);
    assert.doesNotMatch(html, /Оставить отзыв|Написать ещё|<form/);
    if (status === 'rejected') assert.ok(html.includes(review.moderationNote));
    if (status !== 'published') assert.doesNotMatch(html, /Отметок «Полезно»/);
  }
  const html = render({
    reviews: [{ ...previews.personalReviewPreview('published'), helpfulCount: undefined }],
  });
  assert.doesNotMatch(html, /Отметок «Полезно»/);
});

test('empty, loading and error states do not substitute a sample for real account data', () => {
  const preview = previews.personalReviewPreview('published');
  assert.match(render(), /Как тебе твой майнор/);
  assert.doesNotMatch(render(), /27|UX-дизайн/);
  assert.match(render({ preview }), /демонстрационный отзыв/);
  const real = { ...preview, experience: 'Мой настоящий отзыв' };
  const html = render({ reviews: [real], preview });
  assert.match(html, /Мой настоящий отзыв/);
  assert.doesNotMatch(html, /демонстрационный отзыв/);
  for (const status of ['loading', 'error']) {
    const html = render({ status, preview, reviews: [real], error: new Error('Ошибка загрузки') });
    assert.doesNotMatch(html, /Мой настоящий отзыв|демонстрационный отзыв|Отметок «Полезно»/);
    if (status === 'error') assert.match(html, /Повторить загрузку/);
  }
});

test('review remains readable when course metadata is unavailable', () => {
  const review = previews.personalReviewPreview('pending');
  const html = render({ reviews: [review], catalogStatus: 'error' });
  assert.ok(html.includes(review.experience));
  assert.match(html, /Название майнора недоступно/);
  assert.match(html, /Название майнора не загрузилось/);
  assert.doesNotMatch(html, /href="\/disciplines/);
});
