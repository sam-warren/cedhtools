// gridUtils.ts
import { ICardStat } from 'src/types';

interface Section {
  typeCode: string;
  cards: ICardStat[];
}

interface CardStats {
  main: Record<string, ICardStat[]>;
  other: ICardStat[];
}

export const getSortedSections = (cardStats: CardStats): Section[] => {
  const mainSections = Object.entries(cardStats.main)
    .filter(([, cards]: [string, ICardStat[]]) => cards.length > 0)
    .sort(([aCode], [bCode]) => parseInt(aCode) - parseInt(bCode))
    .map(([typeCode, cards]: [string, ICardStat[]]) => ({
      typeCode,
      cards,
    }));

  const otherCards =
    cardStats.other.length > 0
      ? [
          {
            typeCode: 'other',
            cards: cardStats.other
              .filter((card) => card.legality === 'legal')
              .sort((a, b) => b.decks_with_card - a.decks_with_card),
          },
        ]
      : [];

  return [...mainSections, ...otherCards];
};

export const organizeRows = (
  sections: Section[],
  cardsPerRow: number,
): Section[][] => {
  const isSmallSection = (cards: ICardStat[]) => cards.length <= cardsPerRow;

  return sections.reduce<Section[][]>((rows, section) => {
    const lastRow = rows[rows.length - 1];

    if (
      !lastRow ||
      !isSmallSection(section.cards) ||
      !isSmallSection(lastRow[0].cards)
    ) {
      rows.push([section]);
    } else {
      const totalCardsInRow = lastRow.reduce(
        (sum, s) => sum + s.cards.length,
        0,
      );

      if (totalCardsInRow + section.cards.length <= cardsPerRow) {
        lastRow.push(section);
      } else {
        rows.push([section]);
      }
    }

    return rows;
  }, []);
};
