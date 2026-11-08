import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createServer } from 'vite';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

let server;
let model;
let items;
let CatalogCard;
let api;
let apiErrors;
let makeDemoRepository;
let resolveCatalogMode;
let heroCycle;
const filters = { query: '', direction: 'all', faculties: [], minimumRating: 0, sort: 'reviews' };

before(async () => {
  server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
  model = await server.ssrLoadModule('/src/features/catalog/catalogModel.ts');
  ({ DEMO_DISCIPLINES: items } = await server.ssrLoadModule(
    '/src/features/catalog/catalogDemo.ts',
  ));
  ({ CatalogCard } = await server.ssrLoadModule('/src/features/catalog/CatalogCard.tsx'));
  api = await server.ssrLoadModule('/src/features/catalog/catalogApi.ts');
  apiErrors = await server.ssrLoadModule('/src/shared/api/client.ts');
  ({ createDemoCatalogRepository: makeDemoRepository } = await server.ssrLoadModule(
    '/src/features/catalog/catalogDemoRepository.ts',
  ));
  ({ resolveCatalogMode } = await server.ssrLoadModule(
    '/src/features/catalog/catalogRepository.ts',
  ));
  heroCycle = await server.ssrLoadModule('/src/features/catalog/heroReviewCycle.ts');
});

after(async () => {
  await server?.close();
});

test('hero reviews use a 5.5 second cycle, stagger by half a cycle, and never repeat together', () => {
  let cycle = heroCycle.initialHeroReviewCycle(5);
  let now = 0;
  const departures = [[], []];
  for (let step = 0; step < 90; step++) {
    const delay = Math.min(...cycle.slots.map((slot) => slot.remaining));
    now += delay;
    const previous = cycle;
    cycle = heroCycle.advanceHeroReviewCycle(
      {
        ...cycle,
        slots: cycle.slots.map((slot) => ({ ...slot, remaining: slot.remaining - delay })),
      },
      5,
    );
    cycle.slots.forEach((slot, index) => {
      if (slot.phase === 'leaving' && previous.slots[index].phase === 'still') {
        departures[index].push(now);
        assert.equal(slot.remaining, 200);
      }
      if (slot.phase === 'entering') {
        assert.equal(slot.remaining, 320);
        assert.notEqual(slot.index, previous.slots[index].index);
      }
    });
    assert.notEqual(cycle.slots[0].index, cycle.slots[1].index);
  }
  assert.equal(departures[0][0], 5500);
  assert.equal(departures[1][0] - departures[0][0], 2750);
  departures.forEach((times) =>
    times.slice(1).forEach((time, i) => {
      assert.equal(time - times[i], 5500);
    }),
  );
});

test('short hero review lists stay stable without entering a replacement loop', () => {
  for (const count of [0, 1, 2]) {
    const cycle = heroCycle.initialHeroReviewCycle(count);
    assert.equal(cycle.slots.length, count);
    assert.deepEqual(heroCycle.advanceHeroReviewCycle(cycle, count), cycle);
  }
});

test('default first page follows the supplied mockup and the next page has different cards', () => {
  const selected = model.selectDisciplines(items, filters);
  assert.deepEqual(
    selected.slice(0, model.PAGE_SIZE).map((item) => item.id),
    ['data-analysis', 'management', 'psychology', 'law', 'ux-design', 'modern-art'],
  );
  assert.equal(selected.length, 12);
  assert.equal(new Set(selected.map((item) => item.id)).size, 12);
  assert.equal(selected.slice(model.PAGE_SIZE).length, 6);
});

test('search supports Russian case, multiple words, faculty abbreviations and direction names', () => {
  assert.deepEqual(
    model
      .selectDisciplines(items, { ...filters, query: '  АНАЛИЗ  данных ' })
      .map((item) => item.id),
    ['data-analysis'],
  );
  assert.equal(model.selectDisciplines(items, { ...filters, query: 'ФКН' }).length, 2);
  assert.deepEqual(
    model.selectDisciplines(items, { ...filters, query: 'общество' }).map((item) => item.id),
    ['psychology', 'law', 'digital-law'],
  );
});

test('direction, faculty, rating and search are applied together', () => {
  const result = model.selectDisciplines(items, {
    ...filters,
    direction: 'it',
    faculties: ['Факультет компьютерных наук'],
    minimumRating: 4.5,
    query: 'данных',
  });
  assert.deepEqual(
    result.map((item) => item.id),
    ['data-analysis'],
  );
  assert.deepEqual(
    model.selectDisciplines(items, { ...filters, direction: 'soc', faculties: ['Школа дизайна'] }),
    [],
  );
});

test('multiple faculties are combined with OR, then intersected with rating and search', () => {
  const faculties = ['Факультет компьютерных наук', 'Высшая школа бизнеса'];
  assert.deepEqual(
    model
      .selectDisciplines(items, { ...filters, faculties, minimumRating: 4 })
      .map((item) => item.id),
    ['data-analysis', 'management', 'business-informatics', 'statistics'],
  );
  assert.deepEqual(
    model
      .selectDisciplines(items, { ...filters, faculties, minimumRating: 4.5 })
      .map((item) => item.id),
    ['data-analysis'],
  );
  assert.deepEqual(
    model
      .selectDisciplines(items, { ...filters, faculties, query: 'бизнес' })
      .map((item) => item.id),
    ['management', 'business-informatics'],
  );
  assert.equal(model.selectDisciplines(items, { ...filters, faculties: [] }).length, items.length);
});

test('unknown search returns an empty result and clearing it restores the catalog', () => {
  assert.equal(
    model.selectDisciplines(items, { ...filters, query: 'Квантовая кулинария' }).length,
    0,
  );
  assert.equal(model.selectDisciplines(items, filters).length, items.length);
});

test('sorting does not mutate data and works on a favorites subset', () => {
  const ids = items.map((item) => item.id);
  assert.equal(model.selectDisciplines(items, { ...filters, sort: 'rating' })[0].id, 'ux-design');
  const favorites = items.filter((item) => ['law', 'ux-design'].includes(item.id));
  assert.deepEqual(
    model.selectDisciplines(favorites, { ...filters, sort: 'rating' }).map((item) => item.id),
    ['ux-design', 'law'],
  );
  assert.deepEqual(
    items.map((item) => item.id),
    ids,
  );
});

test('bad or unavailable storage is recovered without crashing', () => {
  for (const raw of [null, 'broken', 'null', '{}']) {
    assert.deepEqual(model.parseFavorites(raw), []);
    assert.deepEqual(model.parseReviews(raw), []);
  }
  assert.deepEqual(model.parseFavorites('["law", "law", 42, null, "ux-design"]'), [
    'law',
    'ux-design',
  ]);
});

test('local reviews round-trip all five ratings and reject invalid saved records', () => {
  const review = {
    id: 'demo-1',
    disciplineId: 'law',
    experience: 'Полезный курс',
    advice: '',
    status: 'local',
    ratings: { difficulty: 3, workload: 4, interest: 5, usefulness: 5, recommendation: 5 },
  };
  assert.deepEqual(model.parseReviews(JSON.stringify([review])), [review]);
  assert.deepEqual(
    model.parseReviews(
      JSON.stringify([
        { ...review, ratings: { ...review.ratings, interest: 6 } },
        { ...review, ratings: null },
        { id: 12 },
      ]),
    ),
    [],
  );
});

test('Russian result and review counts use the correct forms', () => {
  assert.deepEqual([0, 1, 2, 5, 11, 21, 22].map(model.disciplineCount), [
    '0 дисциплин',
    '1 дисциплина',
    '2 дисциплины',
    '5 дисциплин',
    '11 дисциплин',
    '21 дисциплина',
    '22 дисциплины',
  ]);
  assert.equal(model.reviewCount(84), '84 отзыва');
  assert.equal(model.reviewCount(11), '11 отзывов');
});

test('cards reuse accessible icons and expose favorite state and faculty', () => {
  const html = renderToStaticMarkup(
    createElement(CatalogCard, {
      item: items[0],
      favorite: true,
      onFavorite() {},
    }),
  );
  assert.match(html, /Интеллектуальный анализ данных/);
  assert.match(html, /title="Факультет компьютерных наук"/);
  assert.match(html, /aria-pressed="true"/);
  assert.match(html, /Убрать из избранного/);
  assert.match(html, /128 отзывов/);
});

const minorDto = {
  id: 42,
  name: 'Анализ данных',
  direction: 'it',
  faculty: 'Факультет компьютерных наук',
  faculty_label: 'ФКН',
  rating: 4.6,
  review_count: 128,
  review_preview: { rating: 5, text: 'Много практики.' },
};
const reviewInput = {
  disciplineId: '42',
  ratings: { difficulty: 3, workload: 4, interest: 5, usefulness: 5, recommendation: 5 },
  experience: 'Полезный курс',
  advice: 'Выбирайте по интересам',
};
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

test('production defaults to api and development defaults to demo', () => {
  assert.equal(resolveCatalogMode(undefined, false), 'api');
  assert.equal(resolveCatalogMode(undefined, true), 'demo');
  assert.equal(resolveCatalogMode('demo', false), 'demo');
  assert.equal(resolveCatalogMode('api', true), 'api');
  assert.throws(() => resolveCatalogMode('typo', true));
});

test('API adapts the documented minor DTO and passes cookie credentials and cancellation', async () => {
  const controller = new AbortController();
  const repository = api.createApiCatalogRepository({
    baseUrl: '/api/',
    fetcher: async (url, init) => {
      assert.equal(url, '/api/minors');
      assert.equal(init.credentials, 'include');
      assert.equal(init.signal, controller.signal);
      assert.equal(init.cache, 'no-store');
      return json({ items: [minorDto] });
    },
  });
  assert.deepEqual(await repository.listDisciplines(controller.signal), [
    {
      id: '42',
      title: 'Анализ данных',
      direction: 'it',
      faculty: minorDto.faculty,
      facultyLabel: 'ФКН',
      rating: 4.6,
      reviewCount: 128,
      reviews: [minorDto.review_preview],
    },
  ]);
});

test('old incomplete backend responses fail explicitly instead of inventing metadata', async () => {
  const repository = api.createApiCatalogRepository({
    fetcher: async () =>
      json({ items: [{ id: 42, name: 'Анализ', hse_url: 'https://www.hse.ru/' }] }),
  });
  await assert.rejects(repository.listDisciplines(), apiErrors.ApiContractError);
});

test('API errors do not fall back to demo and a non-JSON 401 is recognized', async () => {
  const unauthorized = api.createApiCatalogRepository({
    fetcher: async () => new Response('authentication required', { status: 401 }),
  });
  await assert.rejects(unauthorized.listDisciplines(), (error) => apiErrors.isUnauthorized(error));
  const failed = api.createApiCatalogRepository({
    fetcher: async () => json({ error: 'Ошибка сервиса' }, 500),
  });
  await assert.rejects(
    failed.listDisciplines(),
    (error) => error.status === 500 && error.message === 'Ошибка сервиса',
  );
});

test('favorites use idempotent server mutations rather than localStorage', async () => {
  const calls = [];
  const repository = api.createApiCatalogRepository({
    fetcher: async (url, init) => {
      calls.push([url, init.method]);
      return init.method ? new Response(null, { status: 204 }) : json({ items: [42, 77] });
    },
  });
  assert.deepEqual(await repository.listFavorites(), ['42', '77']);
  await repository.setFavorite('42', true);
  await repository.setFavorite('42', false);
  assert.deepEqual(calls, [
    ['/me/favorites', undefined],
    ['/me/favorites/42', 'PUT'],
    ['/me/favorites/42', 'DELETE'],
  ]);
  await assert.rejects(repository.setFavorite('demo-slug', true), apiErrors.ApiContractError);
  assert.equal(calls.length, 3);
});

test('review POST matches the existing Go request body and confirms moderation status', async () => {
  const repository = api.createApiCatalogRepository({
    fetcher: async (url, init) => {
      assert.equal(url, '/reviews');
      assert.equal(init.method, 'POST');
      assert.equal(init.headers.get('Content-Type'), 'application/json');
      assert.deepEqual(JSON.parse(init.body), {
        minor_id: 42,
        completion_year: null,
        difficulty_rating: 3,
        workload_rating: 4,
        interest_rating: 5,
        usefulness_rating: 5,
        recommendation_rating: 5,
        experience_text: 'Полезный курс',
        selection_advice: 'Выбирайте по интересам',
      });
      return json({ id: 100, status: 'pending' }, 201);
    },
  });
  assert.deepEqual(await repository.createReview(reviewInput), {
    ...reviewInput,
    id: '100',
    status: 'pending',
  });
  const conflict = api.createApiCatalogRepository({
    fetcher: async () => json({ error: 'У вас уже есть отзыв на проверке' }, 409),
  });
  await assert.rejects(
    conflict.createReview(reviewInput),
    (error) => error.status === 409 && error.message.includes('на проверке'),
  );
});

test('published and personal reviews adapt nullable texts and server statuses', async () => {
  const dto = {
    id: 100,
    minor_id: 42,
    difficulty_rating: 3,
    workload_rating: 4,
    interest_rating: 5,
    usefulness_rating: 5,
    recommendation_rating: 5,
    experience_text: null,
    selection_advice: 'Совет',
    status: 'pending',
  };
  const repository = api.createApiCatalogRepository({
    fetcher: async () => json({ items: [dto] }),
  });
  assert.deepEqual(await repository.listMyReviews(), [
    { ...reviewInput, id: '100', experience: '', advice: 'Совет', status: 'pending' },
  ]);
  assert.deepEqual(await repository.listReviews('42'), [{ rating: 5, text: 'Совет' }]);
});

test('unrated disciplines stay visible by default and are excluded by a rating filter', () => {
  const empty = api.decodeDiscipline({
    ...minorDto,
    rating: null,
    review_count: 0,
    review_preview: null,
  });
  assert.equal(model.selectDisciplines([empty], filters).length, 1);
  assert.equal(model.selectDisciplines([empty], { ...filters, minimumRating: 4 }).length, 0);
  const html = renderToStaticMarkup(
    createElement(CatalogCard, { item: empty, favorite: false, onFavorite() {} }),
  );
  assert.match(html, /Пока нет оценок/);
  assert.match(html, /0 отзывов/);
});

test('demo and API share the repository interface; demo writes stay in its own storage', async () => {
  const data = new Map();
  const storage = {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
  };
  const repository = makeDemoRepository(storage, () => 'demo-id');
  await repository.setFavorite('ux-design', true);
  await repository.setFavorite('ux-design', true);
  assert.deepEqual(await repository.listFavorites(), ['ux-design']);
  const saved = await repository.createReview(reviewInput);
  assert.equal(saved.status, 'local');
  assert.deepEqual(await repository.listMyReviews(), [saved]);
  assert.ok([...data.keys()].every((key) => key.includes('-demo-')));
  const blocked = makeDemoRepository({
    getItem: () => null,
    setItem: () => {
      throw new Error('quota');
    },
  });
  await assert.rejects(blocked.setFavorite('law', true), apiErrors.CatalogStorageError);
});
