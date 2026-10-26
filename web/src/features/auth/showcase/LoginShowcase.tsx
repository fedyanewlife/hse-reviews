import { useState, type CSSProperties } from 'react';
import { Heart, MessageCircleMore, Star } from 'lucide-react';
import { DirectionMark } from '../../../components/ui/DirectionMark';
import { DIRECTIONS } from '../../../components/ui/directions';
import { Icon } from '../../../components/ui/Icon';
import { SearchField } from '../../../components/ui/SearchField';
import { cx } from '../../../lib/cx';
import { SHOWCASE_CARDS, type BubbleSpot, type ShowcaseCard } from './showcaseData';
import { useShowcaseCycle } from './useShowcaseCycle';
import styles from './LoginShowcase.module.css';

const QUERIES = SHOWCASE_CARDS.map((card) => card.query);
const BUBBLE_COUNTS = SHOWCASE_CARDS.map((card) => card.bubbles.length);

/** Длинные названия набираются мельче, чтобы помещаться в две строки, а не в три. */
const LONG_TITLE_LENGTH = 32;

/**
 * Раскладка облачков задана в пикселях для ряда шириной 580 px. На экран она переводится
 * в проценты, чтобы облачки сжимались вместе с карточкой и не уходили за край.
 */
const ROW_WIDTH = 580;
const LEFT_EDGE = 250;
const RIGHT_EDGE = 330;

const percentOfRow = (px: number) => `${((px / ROW_WIDTH) * 100).toFixed(3)}%`;

/** Хвостик смотрит к карточке: у левых облачков он справа, у правых — слева. */
function tailX({ x, width }: BubbleSpot) {
  const mid = x + width / 2;
  if (mid < LEFT_EDGE) return 'calc(100% - 46px)';
  if (mid > RIGHT_EDGE) return '30px';
  return '42%';
}

const ratingFormat = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/**
 * Декоративная витрина справа от формы входа: показывает, как выглядит поиск по каталогу.
 * Скрыта от скринридеров, на наведение мыши ставится на паузу.
 */
export function LoginShowcase() {
  const [paused, setPaused] = useState(false);
  const { state, reducedMotion } = useShowcaseCycle(QUERIES, BUBBLE_COUNTS, paused);

  const cards = reducedMotion ? SHOWCASE_CARDS.slice(0, 1) : SHOWCASE_CARDS;
  const active = SHOWCASE_CARDS[state.index] ?? SHOWCASE_CARDS[0]!;
  const cardVisible = state.phase === 'show' || state.phase === 'erasing';

  const bubbles = active.bubbles.map((spot) => ({
    ...active.reviews[spot.review % active.reviews.length]!,
    spot,
    visible: state.phase === 'show' && spot.order < state.visibleBubbles,
  }));

  const renderBubble = (bubble: (typeof bubbles)[number], i: number) => (
    <div
      key={`${active.query}-${i}`}
      className={cx(styles.bubble, bubble.visible && styles.bubbleVisible)}
      style={
        {
          '--x': percentOfRow(bubble.spot.x),
          '--width': percentOfRow(bubble.spot.width),
          '--offset': `${bubble.spot.offset}px`,
          '--tail-x': tailX(bubble.spot),
        } as CSSProperties
      }
    >
      <span className={styles.tail} />
      <span className={styles.bubbleRating}>
        <Icon icon={Star} size={14} className={styles.star} />
        {bubble.rating}
      </span>
      <span className={styles.bubbleText}>{bubble.text}</span>
    </div>
  );

  return (
    <div
      className={styles.showcase}
      style={{ backgroundColor: DIRECTIONS[active.direction].bg }}
      aria-hidden="true"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {cards.map((card) => (
        <span
          key={card.query}
          className={cx(styles.layer, card === active && styles.layerActive)}
          style={{ '--layer-bg': DIRECTIONS[card.direction].bg } as CSSProperties}
        />
      ))}

      <div className={styles.stage}>
        <div className={styles.bubblesTop}>
          {bubbles.filter((b) => b.spot.placement === 'top').map(renderBubble)}
        </div>

        <div className={styles.center}>
          <SearchField
            className={styles.search}
            size="l"
            placeholder="Название майнора или факультет"
            value={active.query.slice(0, state.typedLength)}
            readOnly
            tabIndex={-1}
          />
          <div className={styles.cards}>
            {cards.map((card) => (
              <MinorCard
                key={card.query}
                card={card}
                active={card === active}
                visible={card === active && cardVisible}
              />
            ))}
          </div>
        </div>

        <div className={styles.bubblesBottom}>
          {bubbles.filter((b) => b.spot.placement === 'bottom').map(renderBubble)}
        </div>
      </div>
    </div>
  );
}

function MinorCard({
  card,
  active,
  visible,
}: {
  card: ShowcaseCard;
  active: boolean;
  visible: boolean;
}) {
  return (
    <article
      className={cx(styles.card, active && styles.cardActive, visible && styles.cardVisible)}
      style={{ '--dir-color': DIRECTIONS[card.direction].color } as CSSProperties}
    >
      <span className={styles.cardLine} />
      <div className={styles.cardBody}>
        <span className={styles.cardMark}>
          <DirectionMark direction={card.direction} size="s" />
          <span className={styles.cardCity}>{card.city ?? 'Москва'}</span>
        </span>
        <p
          className={cx(
            styles.cardTitle,
            card.title.length > LONG_TITLE_LENGTH && styles.cardTitleLong,
          )}
        >
          {card.title}
        </p>
        <span className={styles.cardMeta}>
          <span className={styles.metaItem}>
            <Icon icon={Star} size={20} className={styles.star} />
            <strong className={styles.ratingValue}>{ratingFormat.format(card.rating)}</strong>
          </span>
          <span>·</span>
          <span className={styles.metaItem}>
            <Icon icon={MessageCircleMore} size={20} />
            <span>{card.reviewCount}</span>
          </span>
        </span>
        <span className={styles.cardActions}>
          <span className={styles.cardAction}>
            <Icon icon={Heart} size={18} />
          </span>
        </span>
      </div>
    </article>
  );
}
