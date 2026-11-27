import { SelectMenu } from '../../components/ui/SelectMenu';
import { DIRECTIONS } from '../../components/ui/directions';
import { cx } from '../../lib/cx';
import { useMediaQuery } from '../../lib/useMediaQuery';
import { CATALOG_DIRECTIONS, type CatalogFilters } from './catalogTypes';
import styles from './CatalogFilterBar.module.css';

type FilterBarProps = {
  filters: CatalogFilters;
  onChange: (update: Partial<CatalogFilters>) => void;
};

const directionOptions = [
  { value: 'all' as const, label: 'Все направления', triggerLabel: 'Направления' },
  ...CATALOG_DIRECTIONS.map(({ id, label }) => ({ value: id, label })),
].map((option) => {
  const directions =
    option.value === 'all' ? CATALOG_DIRECTIONS.map(({ id }) => id) : [option.value];
  return {
    ...option,
    icon: (
      <span className={styles.directionDots} aria-hidden="true">
        {directions.map((id) => (
          <span key={id} style={{ backgroundColor: DIRECTIONS[id].color }} />
        ))}
      </span>
    ),
  };
});

export function CatalogFilterBar({ filters, onChange }: FilterBarProps) {
  const compact = useMediaQuery('(max-width: 400px)');
  return (
    <div className={styles.bar} role="group" aria-label="Фильтры и сортировка">
      <SelectMenu
        value={filters.direction}
        onChange={(direction) => onChange({ direction })}
        options={directionOptions}
        label="Направления"
        caption=""
        className={cx(
          styles.control,
          styles.directionControl,
          filters.direction !== 'all' && styles.selectedDirection,
        )}
      />
      <SelectMenu
        value={filters.sort}
        className={styles.control}
        caption=""
        onChange={(sort) => onChange({ sort })}
        options={[
          {
            value: 'reviews',
            label: 'Больше отзывов',
            triggerLabel: compact ? 'По отзывам' : undefined,
          },
          { value: 'rating', label: 'Выше рейтинг' },
          { value: 'title', label: 'По алфавиту' },
        ]}
      />
    </div>
  );
}
