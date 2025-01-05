from typing import List, Optional, Dict
from django.db.models import QuerySet
from ...models import MoxfieldDeck, MoxfieldDeckCard, MoxfieldCard


class DeckRepository:
    @staticmethod
    def get_deck_by_public_id(public_id: str) -> Optional[MoxfieldDeck]:
        """Retrieve a deck by its public ID."""
        return MoxfieldDeck.objects.filter(public_id=public_id).first()

    @staticmethod
    def get_deck_cards(deck_id: str) -> QuerySet:
        """Get all cards for a specific deck."""
        return (MoxfieldDeckCard.objects
                .filter(deck_id=deck_id)
                .select_related('card')
                .values('card__unique_card_id', 'board', 'quantity'))

    @staticmethod
    def get_decks_by_commander(commander_id: str) -> QuerySet:
        """Get all decks that use a specific commander."""
        return (MoxfieldDeck.objects
                .filter(moxfielddeckcard__card__unique_card_id=commander_id,
                        moxfielddeckcard__board='commanders'))

    @staticmethod
    def get_deck_with_cards(deck_id: str) -> Optional[Dict]:
        """Get deck with all its cards and their details."""
        deck = MoxfieldDeck.objects.filter(id=deck_id).first()
        if not deck:
            return None

        cards = (MoxfieldDeckCard.objects
                 .filter(deck_id=deck_id)
                 .select_related('card__scryfall_card')
                 .values(
                     'card__unique_card_id',
                     'board',
                     'quantity',
                     'card__scryfall_card__type_line'
                 ))

        return {
            'deck': deck,
            'cards': list(cards)
        }
