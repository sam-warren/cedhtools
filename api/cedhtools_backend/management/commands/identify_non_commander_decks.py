from django.core.management.base import BaseCommand
from django.db.models import Q

from ...models import MoxfieldDeck, TopdeckPlayerStanding, TopdeckTournament


class Command(BaseCommand):
    help = 'Identify all MoxfieldDecks not of format "commander" and print associated tournaments.'

    def handle(self, *args, **options):
        self.stdout.write(
            "Identifying non-commander decks and their associated tournaments...\n")

        # Step 1: Retrieve all MoxfieldDecks where format is not "commander"
        non_commander_decks = MoxfieldDeck.objects.exclude(
            format__iexact='commander'
        )

        deck_count = non_commander_decks.count()
        self.stdout.write(f"Found {deck_count} non-commander deck(s).\n")

        if deck_count == 0:
            self.stdout.write("No non-commander decks found. Exiting.")
            return

        # Step 2: Retrieve all TopdeckPlayerStanding entries linked to these decks
        standings = TopdeckPlayerStanding.objects.filter(
            deck__in=non_commander_decks
        ).select_related('tournament')

        if not standings.exists():
            self.stdout.write("No tournaments found for non-commander decks.")
            return

        # Step 3: Extract unique tournaments from the standings
        tournaments = TopdeckTournament.objects.filter(
            standings__in=standings
        ).distinct()

        tournament_count = tournaments.count()
        self.stdout.write(
            f"Found {tournament_count} unique tournament(s) associated with non-commander decks:\n")

        # Step 4: Print tournament details
        for tournament in tournaments:
            self.stdout.write(f"- Tournament ID: {tournament.tid}")
            self.stdout.write(f"  Name: {tournament.tournament_name}")
            self.stdout.write(f"  Game: {tournament.game}")
            self.stdout.write(f"  Format: {tournament.format}")
            self.stdout.write(
                f"  Start Date (Unix Timestamp): {tournament.start_date}")
            self.stdout.write(f"  Top Cut: {tournament.top_cut}\n")

        self.stdout.write("Identification complete.")
