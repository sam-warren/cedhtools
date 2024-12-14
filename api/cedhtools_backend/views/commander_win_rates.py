from django.views import View
from django.http import JsonResponse
from django.db.models import F
from datetime import datetime
from collections import defaultdict

from ..models import TopdeckTournament, TopdeckPlayerStanding, MoxfieldBoard


class CommanderWinRateView(View):
    """
    A class-based view to calculate the overall win rate for each unique commander 
    over a given timeframe.
    """

    def get_timeframe(self, request):
        """
        Parse the start_date and end_date from the request.
        """
        start_date_str = request.GET.get('start_date', '')
        end_date_str = request.GET.get('end_date', '')

        try:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
            return start_date, end_date
        except ValueError:
            return None, None

    def get_tournaments(self, start_date, end_date):
        """
        Retrieve tournaments within the specified timeframe.
        """
        return TopdeckTournament.objects.filter(
            start_date__gte=int(start_date.timestamp()),
            start_date__lte=int(end_date.timestamp())
        )

    def get_standings(self, tournaments):
        """
        Retrieve all player standings for the given tournaments.
        """
        return TopdeckPlayerStanding.objects.filter(tournament__in=tournaments)

    def aggregate_results(self, standings):
        """
        Process the standings to calculate win rates by commander combination.
        """
        commander_results = defaultdict(
            lambda: {'wins': 0, 'draws': 0, 'losses': 0, 'total_games': 0})

        for standing in standings:
            if not standing.deck:
                continue

            # Get the commanders from the deck's `commanders` board
            commanders_board = MoxfieldBoard.objects.filter(
                deck=standing.deck, key='commanders').first()
            if not commanders_board:
                continue

            # Get all commander cards in this board
            commander_cards = commanders_board.board_cards.values_list(
                'card__name', flat=True)
            if not commander_cards:
                continue

            # Sort commander names alphabetically to ensure equivalence (e.g., Tymna / Tana == Tana / Tymna)
            commander_key = " / ".join(sorted(commander_cards))

            # Aggregate the wins, draws, and losses
            commander_results[commander_key]['wins'] += standing.wins
            commander_results[commander_key]['draws'] += standing.draws
            commander_results[commander_key]['losses'] += standing.losses
            commander_results[commander_key]['total_games'] += (
                standing.wins + standing.draws + standing.losses
            )

        return commander_results

    def calculate_win_rates(self, commander_results):
        """
        Calculate win rates for each commander and format the results.
        """
        results = []
        for commander, data in commander_results.items():
            total_games = data['total_games']
            if total_games > 0:
                win_rate = data['wins'] / total_games
                results.append({
                    'commander': commander,
                    'wins': data['wins'],
                    'draws': data['draws'],
                    'losses': data['losses'],
                    # Convert to percentage
                    'win_rate': round(win_rate * 100, 2),
                })

        # Sort results by win rate in descending order
        results.sort(key=lambda x: x['win_rate'], reverse=True)
        return results

    def get(self, request, *args, **kwargs):
        # Parse timeframe from request
        start_date, end_date = self.get_timeframe(request)
        if not start_date or not end_date:
            return JsonResponse({'error': 'Invalid date format. Use YYYY-MM-DD.'}, status=400)

        # Retrieve tournaments and standings
        tournaments = self.get_tournaments(start_date, end_date)
        standings = self.get_standings(tournaments)

        # Aggregate results and calculate win rates
        commander_results = self.aggregate_results(standings)
        results = self.calculate_win_rates(commander_results)

        return JsonResponse({'results': results})
