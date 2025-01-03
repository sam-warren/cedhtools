from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('cedhtools_backend', '0002_scryfallcard_collector_number_and_more'),
    ]

    sql = """
    CREATE MATERIALIZED VIEW cedhtools_metrics AS
    WITH deck_metrics AS (
        SELECT COUNT(DISTINCT id) as total_decks
        FROM moxfield_deck
    ),
    tournament_metrics AS (
        SELECT COUNT(*) as total_tournaments
        FROM topdeck_tournament
    ),
    card_metrics AS (
        SELECT COUNT(DISTINCT mc.unique_card_id) as total_unique_cards
        FROM moxfield_card mc
        WHERE mc.unique_card_id IS NOT NULL
    )
    SELECT 
        deck_metrics.total_decks,
        tournament_metrics.total_tournaments,
        card_metrics.total_unique_cards
    FROM 
        deck_metrics,
        tournament_metrics,
        card_metrics;

    CREATE UNIQUE INDEX cedhtools_metrics_unique_idx ON cedhtools_metrics (total_decks);
    """

    reverse_sql = """
    DROP MATERIALIZED VIEW IF EXISTS cedhtools_metrics;
    """

    operations = [
        migrations.RunSQL(
            sql=sql,
            reverse_sql=reverse_sql
        )
    ]
