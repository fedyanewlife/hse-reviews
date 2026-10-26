import type { Direction } from '../../../components/ui/directions';

/** Демонстрационные данные для анимации на странице входа. Не связаны с реальным каталогом. */

/**
 * Облачко с отзывом. Координаты в пикселях внутри ряда над карточкой или под ней:
 * `x` — левый край, `offset` — отступ от карточки, `review` — индекс отзыва,
 * `order` — очередь появления (облачка всплывают не в том порядке, в каком стоят).
 */
export type BubbleSpot = {
  placement: 'top' | 'bottom';
  x: number;
  width: number;
  offset: number;
  review: number;
  order: number;
};

export type ShowcaseCard = {
  query: string;
  direction: Direction;
  title: string;
  city?: string;
  rating: number;
  reviewCount: number;
  reviews: ReadonlyArray<{ rating: number; text: string }>;
  bubbles: readonly BubbleSpot[];
};

export const SHOWCASE_CARDS: readonly ShowcaseCard[] = [
  {
    query: 'анализ',
    direction: 'it',
    title: 'Интеллектуальный анализ данных',
    rating: 4.6,
    reviewCount: 128,
    reviews: [
      { rating: 5, text: 'Много практики на Python, домашки объёмные.' },
      { rating: 4, text: 'Лекции в записи, это удобно.' },
      { rating: 5, text: 'Понятно объясняют статистику с нуля.' },
    ],
    bubbles: [
      { placement: 'top', x: 12, width: 212, offset: 10, review: 0, order: 0 },
      { placement: 'bottom', x: -24, width: 186, offset: 2, review: 1, order: 1 },
      { placement: 'bottom', x: 304, width: 232, offset: 22, review: 2, order: 2 },
    ],
  },
  {
    query: 'менеджмент',
    direction: 'biz',
    title: 'Менеджмент',
    rating: 4.3,
    reviewCount: 96,
    reviews: [
      { rating: 5, text: 'Разбираем кейсы компаний, теории в меру.' },
      { rating: 4, text: 'Много командных заданий.' },
      { rating: 5, text: 'Экзамен по материалам семинаров.' },
    ],
    bubbles: [
      { placement: 'top', x: -12, width: 196, offset: 22, review: 1, order: 1 },
      { placement: 'top', x: 336, width: 214, offset: 0, review: 0, order: 0 },
      { placement: 'bottom', x: 148, width: 244, offset: 12, review: 2, order: 2 },
    ],
  },
  {
    query: 'право',
    direction: 'soc',
    title: 'Право для всех',
    rating: 4.5,
    reviewCount: 54,
    reviews: [
      { rating: 5, text: 'Понятно про договоры и права потребителя.' },
      { rating: 5, text: 'Тесты после каждой темы, не сложные.' },
      { rating: 4, text: 'Местами много терминов.' },
    ],
    bubbles: [
      { placement: 'top', x: 296, width: 252, offset: 4, review: 0, order: 0 },
      { placement: 'bottom', x: 28, width: 204, offset: 18, review: 1, order: 1 },
    ],
  },
  {
    query: 'литература',
    direction: 'cult',
    title: 'Литература сегодня: что читать и как писать',
    rating: 4.7,
    reviewCount: 67,
    reviews: [
      { rating: 5, text: 'Читаем современную прозу и обсуждаем.' },
      { rating: 5, text: 'Короткие тексты каждую неделю.' },
      { rating: 4, text: 'Чтения больше, чем кажется.' },
    ],
    bubbles: [
      { placement: 'top', x: 62, width: 228, offset: 0, review: 2, order: 1 },
      { placement: 'top', x: 352, width: 186, offset: 26, review: 0, order: 0 },
      { placement: 'bottom', x: 318, width: 222, offset: 6, review: 1, order: 2 },
    ],
  },
  {
    query: 'преподавание',
    direction: 'edu',
    title: 'Мастерство преподавания в цифровую эпоху',
    rating: 4.4,
    reviewCount: 31,
    reviews: [
      { rating: 5, text: 'Пробуем онлайн-инструменты для занятий.' },
      { rating: 5, text: 'В конце проводишь своё занятие.' },
      { rating: 4, text: 'Темп спокойный, можно совмещать.' },
    ],
    bubbles: [
      { placement: 'top', x: -28, width: 218, offset: 14, review: 1, order: 0 },
      { placement: 'bottom', x: 108, width: 198, offset: 0, review: 0, order: 1 },
      { placement: 'bottom', x: 368, width: 190, offset: 20, review: 2, order: 2 },
    ],
  },
];
