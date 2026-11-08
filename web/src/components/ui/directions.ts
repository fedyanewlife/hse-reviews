/** Направления каталога. Цвет означает только принадлежность к направлению — не статус и не действие. */
export const DIRECTIONS = {
  it: { label: 'ИТ', color: 'var(--dir-it)', bg: 'var(--dir-it-bg)' },
  biz: { label: 'Бизнес', color: 'var(--dir-biz)', bg: 'var(--dir-biz-bg)' },
  soc: { label: 'Общество', color: 'var(--dir-soc)', bg: 'var(--dir-soc-bg)' },
  cult: { label: 'Культура', color: 'var(--dir-cult)', bg: 'var(--dir-cult-bg)' },
  edu: { label: 'Образование', color: 'var(--dir-edu)', bg: 'var(--dir-edu-bg)' },
} as const;

export type Direction = keyof typeof DIRECTIONS;
