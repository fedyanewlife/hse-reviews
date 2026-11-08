import type { CSSProperties } from 'react';
import { Heart, MessageCircleMore, Star } from 'lucide-react';
import { DirectionMark } from '../../components/ui/DirectionMark';
import { DIRECTIONS } from '../../components/ui/directions';
import { Icon } from '../../components/ui/Icon';
import { IconButton } from '../../components/ui/IconButton';
import { cx } from '../../lib/cx';
import { reviewCount } from './catalogModel';
import { CATALOG_DIRECTIONS, type Discipline } from './catalogTypes';
import styles from './CatalogPage.module.css';

export function CatalogCard({
  item,
  favorite,
  onFavorite,
  favoriteDisabled = false,
}: {
  item: Discipline;
  favorite: boolean;
  onFavorite: () => void;
  favoriteDisabled?: boolean;
}) {
  return (
    <article
      className={styles.card}
      style={{ '--card-accent': DIRECTIONS[item.direction].color } as CSSProperties}
    >
      <div className={styles.cardHeading}>
        <DirectionMark
          direction={item.direction}
          size="s"
          label={CATALOG_DIRECTIONS.find((value) => value.id === item.direction)?.label}
        />
        <span className={styles.faculty} title={item.faculty}>
          {item.facultyLabel ?? item.faculty}
        </span>
      </div>
      <h2 className={cx(styles.cardTitle, item.title.length > 32 && styles.cardTitleLong)}>
        {item.title}
      </h2>
      <div className={styles.cardMeta}>
        <span
          className={styles.rating}
          aria-label={
            item.rating === null
              ? 'Пока нет оценок'
              : `Рейтинг ${item.rating.toLocaleString('ru-RU')} из 5`
          }
        >
          <Icon icon={Star} size={20} className={styles.star} />
          {item.rating === null
            ? '—'
            : item.rating.toLocaleString('ru-RU', { minimumFractionDigits: 1 })}
        </span>
        <span aria-hidden="true">·</span>
        <span
          className={styles.reviewCount}
          aria-label={`${reviewCount(item.reviewCount)} о дисциплине «${item.title}»`}
        >
          <Icon icon={MessageCircleMore} size={20} />
          {item.reviewCount.toLocaleString('ru-RU')}
        </span>
      </div>
      <IconButton
        icon={Heart}
        className={cx(styles.favorite, favorite && styles.favoriteSelected)}
        aria-pressed={favorite}
        disabled={favoriteDisabled}
        onClick={onFavorite}
        label={`${favorite ? 'Убрать из избранного' : 'В избранное'}: ${item.title}`}
      />
    </article>
  );
}

export function CatalogSkeleton() {
  return (
    <div className={styles.grid} aria-hidden="true">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className={cx(styles.card, styles.skeleton)}>
          <div className={styles.skeletonHeading}>
            <span className={styles.skeletonMark} />
            <span className={styles.skeletonFaculty} />
          </div>
          <div className={styles.skeletonName}>
            <span className={styles.skeletonTitle} />
            <span className={styles.skeletonTitleShort} />
          </div>
          <span className={styles.skeletonMeta} />
          <span className={styles.skeletonFavorite} />
        </div>
      ))}
    </div>
  );
}
