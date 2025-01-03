from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = 'Refreshes the CEDHTools metrics materialized view'

    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            self.stdout.write('Refreshing materialized view...')
            cursor.execute(
                'REFRESH MATERIALIZED VIEW CONCURRENTLY cedhtools_metrics;')
            self.stdout.write(self.style.SUCCESS(
                'Successfully refreshed materialized view'))
