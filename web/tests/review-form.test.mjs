import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { createServer } from 'vite';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

let server, model, api, makeDemo, Form;
const items = [
  {
    id: '42',
    title: 'Анализ данных',
    direction: 'it',
    faculty: 'ФКН',
    rating: null,
    reviewCount: 0,
    reviews: [],
  },
  {
    id: '77',
    title: 'Менеджмент',
    direction: 'biz',
    faculty: 'ВШБ',
    rating: null,
    reviewCount: 0,
    reviews: [],
  },
];
before(async () => {
  server = await createServer({
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: 'custom',
  });
  model = await server.ssrLoadModule('/src/features/review-form/reviewFormModel.ts');
  api = await server.ssrLoadModule('/src/features/catalog/catalogApi.ts');
  ({ createDemoCatalogRepository: makeDemo } = await server.ssrLoadModule(
    '/src/features/catalog/catalogDemoRepository.ts',
  ));
  ({ ReviewForm: Form } = await server.ssrLoadModule('/src/features/review-form/ReviewForm.tsx'));
});
after(async () => {
  await server?.close();
});
const ratings = { difficulty: 3, workload: 4, interest: 5, usefulness: 4, recommendation: 5 };
const options = () => model.completionOptions(new Date('2026-11-13T12:00:00Z'));
const validDraft = () => ({
  ...model.emptyDraft(),
  disciplineId: '42',
  completion: 'year:2026',
  ratings: { ...ratings },
  consent: true,
});
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

test('form requires a known minor, completion, five integer ratings and explicit consent, while text is optional', () => {
  const empty = model.emptyDraft();
  assert.equal(Object.keys(model.validateReviewDraft(empty, items, options())).length, 8);
  assert.equal(model.completedAnswers(empty, items, options()), 0);
  const draft = validDraft();
  assert.deepEqual(model.validateReviewDraft(draft, items, options()), {});
  assert.equal(model.completedAnswers(draft, items, options()), 8);
  for (const bad of [0, 6, 2.5, NaN])
    assert.ok(
      model.validateReviewDraft(
        { ...draft, ratings: { ...ratings, interest: bad } },
        items,
        options(),
      ).interest,
    );
  assert.ok(
    model.validateReviewDraft({ ...draft, disciplineId: 'unknown' }, items, options()).disciplineId,
  );
  assert.ok(
    model.validateReviewDraft({ ...draft, completion: 'year:2200' }, items, options()).completion,
  );
  assert.ok(model.validateReviewDraft({ ...draft, consent: false }, items, options()).consent);
  assert.ok(
    model.validateReviewDraft({ ...draft, experience: 'x'.repeat(4001) }, items, options())
      .experience,
  );
});

test('completion choices preserve studying and earlier as separate states and payload texts are trimmed', () => {
  for (const [completion, status, year] of [
    ['year:2026', 'completed', 2026],
    ['earlier', 'earlier', null],
    ['studying', 'studying', null],
  ]) {
    const result = model.reviewInput({
      ...validDraft(),
      completion,
      experience: '  Практика  ',
      advice: '  Совет\n',
    });
    assert.equal(result.completionStatus, status);
    assert.equal(result.completionYear, year);
    assert.equal(result.experience, 'Практика');
    assert.equal(result.advice, 'Совет');
    assert.deepEqual(result.ratings, ratings);
  }
  assert.match(options()[0].label, /2025\/26/);
  assert.equal(model.completionOptions(new Date('2026-04-01T00:00:00Z'))[0].value, 'year:2025');
});

test('draft restoration ignores account metadata and consent, validates ratings and bounds text length', () => {
  for (const raw of ['bad', '{}', 'null', '42'])
    assert.ok(model.restoreDraft(raw) === null || model.restoreDraft(raw).consent === false);
  const restored = model.restoreDraft(
    JSON.stringify({
      ...validDraft(),
      status: 'published',
      experience: 'x'.repeat(9000),
      ratings: { difficulty: 2.5, workload: 9, usefulness: 3 },
    }),
  );
  assert.equal(restored.consent, false);
  assert.equal(restored.experience.length, model.TEXT_LIMIT);
  assert.deepEqual(restored.ratings, { usefulness: 3 });
  assert.equal(restored.status, undefined);
  assert.notEqual(model.reviewDraftStorageKey(true), model.reviewDraftStorageKey(false));
});

test('a requested new minor does not receive another minor’s draft; rejected reviews remain locked to their original minor', () => {
  const stored = { ...validDraft(), experience: 'Черновик про первый майнор' };
  const restored = model.initialDraft(items, null, null, stored);
  assert.equal(restored.experience, stored.experience);
  assert.equal(restored.consent, false);
  const changed = model.initialDraft(items, '77', null, stored);
  assert.equal(changed.disciplineId, '77');
  assert.equal(changed.experience, '');
  const previous = { ...model.reviewInput(stored), id: 'old', status: 'rejected' };
  const resubmission = model.initialDraft(items, '77', previous, null);
  assert.equal(resubmission.disciplineId, '42');
  assert.equal(resubmission.experience, previous.experience);
  assert.equal(resubmission.completion, 'year:2026');
  assert.equal(resubmission.consent, false);
});

test('demo submission round-trips completion metadata and remains local', async () => {
  for (const completion of ['year:2026', 'earlier', 'studying']) {
    const data = new Map();
    const repository = makeDemo({
      getItem: (key) => data.get(key) ?? null,
      setItem: (key, value) => data.set(key, value),
    });
    const input = model.reviewInput({ ...validDraft(), completion });
    const saved = await repository.createReview(input);
    assert.equal(saved.status, 'local');
    assert.deepEqual(await repository.listMyReviews(), [saved]);
  }
});

test('API submission sends the documented completion extension with the existing five ratings', async () => {
  for (const completion of ['year:2026', 'earlier', 'studying']) {
    const input = model.reviewInput({ ...validDraft(), completion });
    const repository = api.createApiCatalogRepository({
      fetcher: async (url, init) => {
        assert.equal(url, '/reviews');
        assert.equal(init.method, 'POST');
        assert.equal(init.credentials, 'include');
        const payload = JSON.parse(init.body);
        assert.equal(payload.minor_id, 42);
        assert.equal(payload.completion_status, input.completionStatus);
        assert.equal(payload.completion_year, input.completionYear);
        assert.equal(payload.recommendation_rating, 5);
        assert.equal(payload.workload_rating, 4);
        assert.equal(payload.consent, undefined);
        return json({ id: 99, status: 'pending' }, 201);
      },
    });
    const result = await repository.createReview(input);
    assert.equal(result.status, 'pending');
    assert.equal(result.completionStatus, input.completionStatus);
  }
});

test('form uses native keyboard radios, labelled optional text fields and an explicit publication checkbox', () => {
  const html = renderToStaticMarkup(
    createElement(Form, {
      items,
      selectedId: '42',
      previous: null,
      demo: true,
      onSave: async () => {},
    }),
  );
  assert.match(html, /Анализ данных/);
  assert.match(html, /type="radio"[^>]*name="difficulty"/);
  const checkbox = html.match(/<input[^>]*name="consent"[^>]*>/)?.[0] ?? '';
  assert.match(checkbox, /type="checkbox"/);
  assert.doesNotMatch(checkbox, /checked/);
  assert.match(html, /Предпросмотр отзыва/);
  assert.match(html, /Сохранить отзыв/);
  assert.match(html, /name="experience"/);
  assert.match(html, /name="advice"/);
  assert.doesNotMatch(html, /На проверке|Опубликован|проверка занимает до суток/);
});
