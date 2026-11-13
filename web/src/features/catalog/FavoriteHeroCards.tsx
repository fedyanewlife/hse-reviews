import type { CSSProperties } from 'react';
import { Heart, Star } from 'lucide-react';
import { DirectionMark } from '../../components/ui/DirectionMark';
import { DIRECTIONS } from '../../components/ui/directions';
import { Icon } from '../../components/ui/Icon';
import { cx } from '../../lib/cx';
import type { Discipline } from './catalogTypes';
import styles from './FavoriteHeroCards.module.css';
import { disciplineHref } from '../discipline/disciplineModel';

export function FavoriteHeroCards({ items }: { items: readonly Discipline[] }) {
  const visible = items.slice(0, 3);
  if (!visible.length) return null;

  return (
    <ul
      className={styles.cards}
      data-count={visible.length}
      aria-label="Первые майноры в избранном"
    >
      {visible.map((item) => (
        <li className={styles.position} key={item.id}>
          <article
            className={styles.card}
            style={{ '--card-accent': DIRECTIONS[item.direction].color } as CSSProperties}
          >
            <div className={styles.heading}>
              <DirectionMark direction={item.direction} size="s" />
              <span className={styles.faculty} title={item.faculty}>
                {item.facultyLabel ?? item.faculty}
              </span>
            </div>
            <h2 className={cx(styles.title, item.title.length > 24 && styles.longTitle)}>
              <a href={disciplineHref(item.id)}>{item.title}</a>
            </h2>
            <div className={styles.meta}>
              <span
                className={styles.rating}
                aria-label={
                  item.rating === null
                    ? 'Пока нет оценок'
                    : `Рейтинг ${item.rating.toLocaleString('ru-RU')} из 5`
                }
              >
                <Icon icon={Star} size={17} className={styles.star} />
                {item.rating === null
                  ? '—'
                  : item.rating.toLocaleString('ru-RU', {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    })}
              </span>
              <Icon icon={Heart} size={15} className={styles.heart} />
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}
