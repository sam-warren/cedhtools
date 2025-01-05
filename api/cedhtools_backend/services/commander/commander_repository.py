from typing import List, Optional, Dict
from django.db.models import QuerySet
from ...models import (
    MoxfieldCard, CommanderDeckRelationships,
    CardPrintings, MoxfieldDeck
)


class CommanderRepository:
    @staticmethod
    def get_commander_details(unique_card_ids: List[str]) -> List[Dict]:
        """Fetch commander details from database."""
        commander_details = []

        for unique_card_id in unique_card_ids:
            # Get the most popular printing
            printing = CardPrintings.objects.filter(
                unique_card_id=unique_card_id
            ).first()

            if printing:
                commander_card = (
                    MoxfieldCard.objects.filter(
                        unique_card_id=unique_card_id,
                        scryfall_card_id=printing.most_common_printing
                    )
                    .select_related('scryfall_card')
                    .values(
                        'unique_card_id',
                        'scryfall_card__id',
                        'scryfall_card__name',
                        'scryfall_card__type_line',
                        'scryfall_card__cmc',
                        'scryfall_card__image_uris',
                        'scryfall_card__legality',
                        'scryfall_card__mana_cost',
                        'scryfall_card__scryfall_uri'
                    )
                    .first()
                )

                if commander_card:
                    # Transform the field names to match serializer expectations
                    transformed_card = {
                        'unique_card_id': commander_card['unique_card_id'],
                        'scryfall_id': str(commander_card['scryfall_card__id']),
                        'name': commander_card['scryfall_card__name'],
                        'type_line': commander_card['scryfall_card__type_line'],
                        'cmc': commander_card['scryfall_card__cmc'],
                        'image_uris': commander_card['scryfall_card__image_uris'],
                        'legality': commander_card['scryfall_card__legality'],
                        'mana_cost': commander_card['scryfall_card__mana_cost'],
                        'scryfall_uri': commander_card['scryfall_card__scryfall_uri']
                    }
                    commander_details.append(transformed_card)

        return commander_details

    @staticmethod
    def find_matching_decks(commander_ids: List[str]) -> QuerySet:
        """Find decks that contain exactly these commanders."""
        return MoxfieldDeck.objects.filter(
            id__in=CommanderDeckRelationships.objects.filter(
                commander_list=sorted(commander_ids)
            ).values('deck_id')
        )
