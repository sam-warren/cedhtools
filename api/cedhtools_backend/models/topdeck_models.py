from django.db import models
from ..validators.moxfield_url_validator import validate_moxfield_url
import logging
import re
from typing import Tuple
from django.db import models, transaction
from . import MoxfieldDeck


class TopdeckTournament(models. Model):
    tid = models.CharField(max_length=255, unique=True)
    swiss_num = models.IntegerField()
    start_date = models.BigIntegerField()
    top_cut = models.IntegerField()

    def __str__(self):
        return self.tid

    class Meta:
        db_table = 'topdeck_tournament'
        indexes = [
            models.Index(fields=['tid']),
            models.Index(fields=['start_date']),
            models.Index(fields=['top_cut'])
        ]


class TopdeckPlayerStanding(models.Model):
    tournament = models.ForeignKey(
        'TopdeckTournament', related_name='standings', on_delete=models.CASCADE
    )
    decklist = models.URLField(
        null=True,
        blank=True,
        max_length=255,
        validators=[validate_moxfield_url]
    )
    deck = models.ForeignKey(
        'MoxfieldDeck', related_name='player_standings', null=True, blank=True, on_delete=models.SET_NULL
    )
    wins = models.IntegerField()
    draws = models.IntegerField()
    losses = models.IntegerField()
    win_rate = models.FloatField()
    draw_rate = models.FloatField()
    loss_rate = models.FloatField()

    def __str__(self):
        return f"{self.decklist}: {self.wins}-{self.draws}-{self.losses}"

    @classmethod
    def link_unlinked_decks(cls) -> Tuple[int, int]:
        """
        Find player standings without linked decks and attempt to link them to MoxfieldDeck records
        using the deck ID from their decklist URL.

        Returns:
            Tuple[int, int]: Count of successful links and failed attempts
        """
        logger = logging.getLogger(__name__)
        successful_links = 0
        failed_links = 0

        try:
            # Find all unlinked standings that have decklist URLs
            unlinked_standings = cls.objects.filter(
                deck__isnull=True,
                decklist__isnull=False
            ).select_for_update()

            logger.info(
                f"Found {unlinked_standings.count()} unlinked standings to process")

            with transaction.atomic():
                for standing in unlinked_standings:
                    try:
                        # Extract deck ID from URL using regex pattern
                        match = re.search(
                            r'https://(?:www\.)?moxfield\.com/decks/([^/]+)', standing.decklist)

                        if not match:
                            logger.warning(
                                f"Could not extract deck ID from URL: {standing.decklist}")
                            failed_links += 1
                            continue

                        deck_id = match.group(1)

                        # Find matching deck
                        deck = MoxfieldDeck.objects.filter(
                            public_id=deck_id).first()

                        if deck:
                            standing.deck = deck
                            standing.save()
                            successful_links += 1
                            logger.debug(
                                f"Successfully linked standing {standing.id} to deck {deck.id}")
                        else:
                            failed_links += 1
                            logger.warning(
                                f"No matching deck found for ID: {deck_id}")

                    except Exception as e:
                        failed_links += 1
                        logger.error(
                            f"Error processing standing {standing.id}: {str(e)}")
                        continue

            logger.info(
                f"Deck linking completed: {successful_links} successful, "
                f"{failed_links} failed"
            )

        except Exception as e:
            logger.error(f"Error during deck linking process: {str(e)}")
            raise

        return successful_links, failed_links

    class Meta:
        db_table = 'topdeck_player_standing'
        indexes = [
            models.Index(fields=['deck']),
            models.Index(fields=['decklist']),
            models.Index(fields=['tournament']),
        ]

    def clean(self):
        if self.decklist:
            validate_moxfield_url(self.decklist)
