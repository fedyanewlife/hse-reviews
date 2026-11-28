import { useLayoutEffect, useRef, type CSSProperties } from 'react';
import { SelectMenu } from '../../components/ui/SelectMenu';
import { DIRECTIONS } from '../../components/ui/directions';
import { CATALOG_DIRECTIONS, type CatalogFilters } from './catalogTypes';
import styles from './CatalogFilterBar.module.css';

type FilterBarProps = {
  filters: CatalogFilters;
  onChange: (update: Partial<CatalogFilters>) => void;
};

const directionOptions = [
  {
    value: 'all' as const,
    label: 'Все направления',
    triggerLabel: 'Направления',
    icon: <span className={styles.directionOptionDot} aria-hidden="true" />,
  },
  ...CATALOG_DIRECTIONS.map(({ id, label }) => ({
    value: id,
    label,
    icon: (
      <span
        className={styles.directionOptionDot}
        data-direction-target={id}
        style={{ '--dot-color': DIRECTIONS[id].color } as CSSProperties}
        aria-hidden="true"
      />
    ),
  })),
];

function DirectionFilter({ filters, onChange }: FilterBarProps) {
  const root = useRef<HTMLDivElement>(null);
  const { direction } = filters;
  const selected = direction === 'all' ? undefined : DIRECTIONS[direction];

  useLayoutEffect(() => {
    const element = root.current;
    const popup = element?.querySelector<HTMLElement>('[role="listbox"]');
    if (!element || !popup) return;

    const origins = element.querySelectorAll<HTMLElement>('[data-direction-origin]');
    const targets = new Map(
      Array.from(element.querySelectorAll<HTMLElement>('[data-direction-target]'), (target) => [
        target.dataset.directionTarget,
        target,
      ]),
    );

    const positionDots = () => {
      element.style.setProperty(
        '--direction-menu-height',
        `${popup.getBoundingClientRect().height}px`,
      );
      for (const origin of origins) {
        const target = targets.get(origin.dataset.directionOrigin);
        if (!target) return;
        const from = origin.getBoundingClientRect();
        const to = target.getBoundingClientRect();
        if (!from.width || !to.width) return;

        const x = to.x - from.x + (to.width - from.width) / 2;
        const y = to.y - from.y + (to.height - from.height) / 2;
        const scale = to.width / from.width;
        origin.style.setProperty('--dot-travel', `translate(${x}px, ${y}px) scale(${scale})`);
        origin.style.setProperty('--dot-home', `translateX(${x}px) scale(${scale})`);
      }
      element.setAttribute('data-dots-ready', '');
    };

    positionDots();
    const observer = new ResizeObserver(positionDots);
    observer.observe(element);
    observer.observe(popup);
    origins.forEach((origin) => observer.observe(origin));
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={root}
      className={styles.directionFilter}
      style={
        selected &&
        ({
          '--direction-color': selected.color,
          '--direction-tint': selected.bg,
        } as CSSProperties)
      }
    >
      <SelectMenu
        value={direction}
        onChange={(direction) => onChange({ direction })}
        options={directionOptions}
        label="Направления"
        caption=""
        keepMounted
        triggerIcon={
          <span
            className={styles.directionDots}
            data-single={selected ? '' : undefined}
            aria-hidden="true"
          >
            {CATALOG_DIRECTIONS.map(({ id }, index) => (
              <span
                key={id}
                data-direction-origin={id}
                data-selected={id === direction ? '' : undefined}
                style={
                  {
                    '--dot-color': DIRECTIONS[id].color,
                    '--dot-delay': `${index * 14}ms`,
                  } as CSSProperties
                }
              />
            ))}
          </span>
        }
        className={`${styles.control} ${styles.directionControl}`}
      />
    </div>
  );
}

export function CatalogFilterBar({ filters, onChange }: FilterBarProps) {
  return (
    <div className={styles.bar} role="group" aria-label="Фильтры и сортировка">
      <DirectionFilter filters={filters} onChange={onChange} />
      <SelectMenu
        value={filters.sort}
        className={styles.control}
        caption=""
        triggerLabel="Сортировка"
        onChange={(sort) => onChange({ sort })}
        options={[
          { value: 'title', label: 'По алфавиту' },
          { value: 'reviews', label: 'Больше отзывов' },
          { value: 'rating', label: 'Выше рейтинг' },
        ]}
      />
    </div>
  );
}
