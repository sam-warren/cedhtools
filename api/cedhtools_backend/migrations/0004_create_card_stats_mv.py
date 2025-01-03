from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('cedhtools_backend', '0003_create_cedhtoolsmetrics_materializedview'),
    ]

    sql = """
    -- First view remains the same
    DROP MATERIALIZED VIEW IF EXISTS commander_deck_relationships;
    CREATE MATERIALIZED VIEW commander_deck_relationships AS
    WITH commander_decks AS (
        SELECT 
            deck_id,
            array_agg(DISTINCT card.unique_card_id ORDER BY card.unique_card_id) as commander_list
        FROM moxfield_deck_card dc
        JOIN moxfield_card card ON dc.card_id = card.id
        WHERE dc.board = 'commanders'
        GROUP BY deck_id
    )
    SELECT 
        deck_id,
        commander_list
    FROM commander_decks;

    CREATE UNIQUE INDEX commander_deck_relationships_deck_idx ON commander_deck_relationships(deck_id);
    CREATE INDEX commander_deck_relationships_commander_list_idx ON commander_deck_relationships USING gin(commander_list);

    -- Updated card statistics view
    DROP MATERIALIZED VIEW IF EXISTS card_statistics_by_commander;
    CREATE MATERIALIZED VIEW card_statistics_by_commander AS
    WITH deck_stats AS (
        -- First aggregate stats by unique_card_id
        SELECT 
            cdr.commander_list,
            mc.unique_card_id,
            COUNT(DISTINCT dc.deck_id) as deck_count,
            AVG(ps.win_rate) as avg_win_rate,
            AVG(ps.draw_rate) as avg_draw_rate,
            AVG(ps.loss_rate) as avg_loss_rate
        FROM commander_deck_relationships cdr
        JOIN moxfield_deck_card dc ON cdr.deck_id = dc.deck_id
        JOIN moxfield_card mc ON dc.card_id = mc.id
        LEFT JOIN topdeck_player_standing ps ON dc.deck_id = ps.deck_id
        WHERE dc.board = 'mainboard'
        GROUP BY cdr.commander_list, mc.unique_card_id
    ),
    -- Get the earliest printing for each unique_card_id
    representative_cards AS (
        SELECT DISTINCT ON (mc.unique_card_id)
            mc.unique_card_id,
            mc.id as card_id,
            mc.scryfall_id,
            sc.name,
            sc.type_line,
            sc.cmc,
            sc.mana_cost,
            sc.image_uris,
            sc.legality,
            sc.released_at,
            sc.collector_number
        FROM moxfield_card mc
        JOIN scryfall_card sc ON mc.scryfall_id = sc.id
        ORDER BY 
            mc.unique_card_id,
            sc.released_at ASC,
            sc.collector_number ASC
    )
    SELECT 
        ds.commander_list,
        ds.unique_card_id,
        rc.card_id,
        rc.scryfall_id,
        rc.name,
        rc.type_line,
        rc.cmc,
        rc.mana_cost,
        rc.image_uris,
        rc.legality,
        ds.deck_count,
        ds.avg_win_rate,
        ds.avg_draw_rate,
        ds.avg_loss_rate
    FROM deck_stats ds
    JOIN representative_cards rc ON ds.unique_card_id = rc.unique_card_id
    WHERE ds.deck_count >= 5;  -- Only include cards with meaningful sample size

    CREATE INDEX card_stats_commander_list_idx ON card_statistics_by_commander USING gin(commander_list);
    CREATE INDEX card_stats_unique_card_idx ON card_statistics_by_commander(unique_card_id);
    """

    reverse_sql = """
    DROP MATERIALIZED VIEW IF EXISTS card_statistics_by_commander;
    DROP MATERIALIZED VIEW IF EXISTS commander_deck_relationships;
    """

    operations = [
        migrations.RunSQL(
            sql=sql,
            reverse_sql=reverse_sql
        )
    ]
