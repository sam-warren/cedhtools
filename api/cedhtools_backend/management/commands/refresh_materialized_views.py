from django.core.management.base import BaseCommand
from django.db import connection
import time


class Command(BaseCommand):
    help = 'Refreshes all materialized views in the database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--sequential',
            action='store_true',
            help='Refresh views sequentially instead of concurrently'
        )

    def handle(self, *args, **options):
        views = [
            'cedhtools_metrics',
            'commander_deck_relationships',
            'card_statistics_by_commander'
        ]

        start_time = time.time()
        self.stdout.write('Starting materialized view refresh...')

        try:
            with connection.cursor() as cursor:
                # First, get list of existing materialized views
                cursor.execute("""
                    SELECT matviewname 
                    FROM pg_matviews
                    WHERE schemaname = 'public'
                """)
                existing_views = {row[0] for row in cursor.fetchall()}

                for view in views:
                    if view not in existing_views:
                        self.stdout.write(self.style.WARNING(
                            f'View {view} does not exist, skipping...'))
                        continue

                    self.stdout.write(f'Refreshing {view}...')
                    refresh_start = time.time()

                    try:
                        if options['sequential']:
                            cursor.execute(
                                f'REFRESH MATERIALIZED VIEW {view};')
                        else:
                            cursor.execute(
                                f'REFRESH MATERIALIZED VIEW CONCURRENTLY {view};')

                        refresh_time = time.time() - refresh_start
                        self.stdout.write(self.style.SUCCESS(
                            f'Successfully refreshed {view} in {refresh_time:.2f} seconds'))

                    except Exception as e:
                        self.stdout.write(self.style.ERROR(
                            f'Error refreshing {view}: {str(e)}'))

                total_time = time.time() - start_time
                self.stdout.write(self.style.SUCCESS(
                    f'Finished refreshing all views in {total_time:.2f} seconds'))

        except Exception as e:
            self.stdout.write(self.style.ERROR(
                f'Fatal error during refresh: {str(e)}'))
            raise
