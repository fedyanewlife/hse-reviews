import type { Discipline } from '../catalog/catalogTypes';
import type { PublishedReview } from './disciplineTypes';

// Synthetic survey answers for development, never returned by the API adapter.
const experiences = [
  'Материал объясняют последовательно, с примерами и разбором вопросов. Больше всего помогла практика: после каждого занятия было понятно, где можно применить новые знания.',
  'Интересный майнор, но задания лучше не откладывать на выходные. Иногда на одну работу уходит заметно больше времени, чем ожидаешь. Обратная связь помогает понять ошибки.',
  'Понравилось, что темы связаны между собой и постепенно складываются в общую картину. На семинарах можно задавать вопросы, даже если что-то не получилось с первого раза.',
  'Первые модули требуют самостоятельной работы, зато материал становится понятнее после практических заданий. Практика помогает разобраться в сложных темах.',
  'Полезный опыт и хороший повод попробовать новое направление. Часть тем оказалась знакомой, но проект помог разобраться глубже. Хотелось бы чуть больше времени на обсуждение работ.',
  'Нагрузка меняется от модуля к модулю. Мне помогло заранее выделить время в расписании и делать задания небольшими частями. В целом впечатления положительные.',
  'Курс оказался сложнее, чем я ожидал. Пришлось вернуться к базовым темам и несколько раз переделывать задания. Для тех, кому интересна область, это хороший способ проверить себя.',
];
const tips = [
  'Заранее посмотри программу и требования к подготовке: некоторые темы предполагают базовые знания.',
  'На задания лучше закладывать несколько вечеров. Перед дедлайном совмещать их с основной учёбой тяжело.',
  'Узнай, как оцениваются семинары и проект. Работа в течение модуля может значить больше, чем итоговый экзамен.',
  'Не стесняйся задавать вопросы и просить обратную связь. Самостоятельной работы достаточно, но разобраться помогают.',
];
const itTips = [
  'Для домашних заданий понадобится время: некоторые работы занимают несколько часов. Лучше начинать их заранее.',
  'Базовый Python и математика очень пригодятся. Если давно не программировал, стоит повторить основы до начала занятий.',
  'Часть материала придётся разбирать самостоятельно, помимо лекций и семинаров. Планируй время на практику.',
  'Машинное обучение начинается не сразу: в первых модулях больше работы с Python и данными.',
];

export function demoPublishedReviews(item: Discipline): PublishedReview[] {
  if (item.reviewCount === 0) return [];
  const count = Math.max(1, Math.round(item.reviewCount / 10));
  const target = Math.round((item.rating ?? 4) * count);
  const base = Math.floor(target / count);
  const recommendations = Array.from(
    { length: count },
    (_, index) => base + Number(index < target - base * count),
  );
  const lower = recommendations.findIndex((value) => value > 1 && value < 5);
  const higher = recommendations.findIndex((value, index) => index !== lower && value < 5);
  if (lower >= 0 && higher >= 0) {
    recommendations[lower] = recommendations[lower]! - 1;
    recommendations[higher] = recommendations[higher]! + 1;
  }
  return Array.from({ length: count }, (_, index) => ({
    id: `${item.id}-review-${index + 1}`,
    disciplineId: item.id,
    completionStatus: index % 3 === 0 ? 'completed' : index % 3 === 1 ? 'earlier' : 'studying',
    completionYear: index % 3 === 0 ? 2026 : null,
    ratings: {
      difficulty: Math.max(1, Math.min(5, (item.direction === 'it' ? 4 : 3) + (index % 3) - 1)),
      workload: Math.max(1, Math.min(5, 4 + (index % 3) - 1)),
      interest: index % 4 === 0 ? 4 : 5,
      usefulness: index % 3 === 0 ? 4 : 5,
      recommendation: recommendations[index]!,
    },
    experience:
      index < item.reviews.length
        ? item.reviews[index]!.text
        : experiences[(index - item.reviews.length) % experiences.length]!,
    advice: (item.id === 'data-analysis' ? itTips : tips)[index % 4]!,
    createdAt: new Date(Date.UTC(2026, 9, 25 - index)).toISOString(),
    helpfulCount: Math.max(0, 12 - index * 2),
  }));
}
