import type { Direction } from '../../../components/ui/directions';

/** Демонстрационные данные для анимации на странице входа. Не связаны с реальным каталогом. */

export type ShowcaseCard = {
  query: string;
  direction: Direction;
  title: string;
  rating: number;
  reviewCount: number;
  reviews: ReadonlyArray<{ rating: number; text: string }>;
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
  },
];

/** Позиции облачков с отзывами: одно над карточкой, два под ней. */
export const BUBBLE_SPOTS = [
  {
    placement: 'top',
    tailX: '36px',
    origin: '36px 100%',
    from: 'translateY(10px) scale(.92)',
    stagger: '0px',
  },
  {
    placement: 'bottom',
    tailX: '40px',
    origin: '40px 0%',
    from: 'translateY(-10px) scale(.92)',
    stagger: '0px',
  },
  {
    placement: 'bottom',
    tailX: 'calc(100% - 54px)',
    origin: 'calc(100% - 54px) 0%',
    from: 'translateY(-10px) scale(.92)',
    stagger: '18px',
  },
] as const;
