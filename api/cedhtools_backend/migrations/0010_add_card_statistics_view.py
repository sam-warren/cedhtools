from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('cedhtools_backend', '0009_add_meta_statistics_view'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
            -- First create the base statistics
            CREATE MATERIALIZED VIEW card_statistics_by_commander AS
            WITH deck_card_stats AS (
                SELECT 
                    cdr.commander_list,
                    mc.unique_card_id,
                    COUNT(DISTINCT mdc.deck_id) as deck_count,
                    AVG(tps.win_rate) as avg_win_rate,
                    STDDEV(tps.win_rate) as win_rate_stddev,
                    AVG(tps.draw_rate) as avg_draw_rate,
                    AVG(tps.loss_rate) as avg_loss_rate,
                    SUM(COALESCE(tps.wins, 0)) as total_wins,
                    SUM(COALESCE(tps.draws, 0)) as total_draws,
                    SUM(COALESCE(tps.losses, 0)) as total_losses
                FROM commander_deck_relationships cdr
                JOIN moxfield_deck_card mdc ON cdr.deck_id = mdc.deck_id
                JOIN moxfield_card mc ON mdc.card_id = mc.id
                LEFT JOIN topdeck_player_standing tps ON mdc.deck_id = tps.deck_id
                WHERE mdc.board = 'mainboard'
                GROUP BY cdr.commander_list, mc.unique_card_id
            )
            SELECT 
                ROW_NUMBER() OVER () as id,
                dcs.*,
                mc.scryfall_id as most_common_printing
            FROM deck_card_stats dcs
            JOIN card_printings cp ON dcs.unique_card_id = cp.unique_card_id
            JOIN moxfield_card mc ON dcs.unique_card_id = mc.unique_card_id 
                AND mc.scryfall_id = cp.most_common_printing
            WHERE dcs.deck_count >= 5;

            CREATE UNIQUE INDEX card_stats_commander_id_idx ON card_statistics_by_commander(id);
            CREATE INDEX card_stats_commander_list_gin_idx ON card_statistics_by_commander USING gin(commander_list);
            CREATE INDEX card_stats_unique_card_idx ON card_statistics_by_commander(unique_card_id);
            CREATE INDEX card_stats_win_rate_idx ON card_statistics_by_commander(avg_win_rate);
            """,
            reverse_sql="DROP MATERIALIZED VIEW IF EXISTS card_statistics_by_commander;"
        ),
    ]
