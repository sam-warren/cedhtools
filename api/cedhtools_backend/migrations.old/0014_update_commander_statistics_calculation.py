from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('cedhtools_backend', '0013_update_commander_meta_statistics'),
    ]

    operations = [
        # Update commander_meta_statistics view
        migrations.RunSQL(
            sql="""
            DROP MATERIALIZED VIEW IF EXISTS commander_meta_statistics;
            
            CREATE MATERIALIZED VIEW commander_meta_statistics AS
            WITH deck_stats AS (
                SELECT 
                    cdr.commander_list,
                    COUNT(DISTINCT tps.deck_id) as total_decks,
                    SUM(COALESCE(tps.wins, 0)) as total_wins,
                    SUM(COALESCE(tps.draws, 0)) as total_draws,
                    SUM(COALESCE(tps.losses, 0)) as total_losses,
                    STDDEV(
                        CASE 
                            WHEN (COALESCE(tps.wins, 0) + COALESCE(tps.draws, 0) + COALESCE(tps.losses, 0)) > 0 
                            THEN COALESCE(tps.wins, 0)::float / (COALESCE(tps.wins, 0) + COALESCE(tps.draws, 0) + COALESCE(tps.losses, 0))
                            ELSE 0 
                        END
                    ) as win_rate_stddev
                FROM commander_deck_relationships cdr
                LEFT JOIN topdeck_player_standing tps ON cdr.deck_id = tps.deck_id
                GROUP BY cdr.commander_list
            )
            SELECT 
                ROW_NUMBER() OVER () as id,
                commander_list,
                total_decks,
                CASE 
                    WHEN (COALESCE(total_wins, 0) + COALESCE(total_draws, 0) + COALESCE(total_losses, 0)) = 0 THEN 0
                    ELSE COALESCE(total_wins::float, 0) / NULLIF(COALESCE(total_wins, 0) + COALESCE(total_draws, 0) + COALESCE(total_losses, 0), 0)
                END as avg_win_rate,
                CASE 
                    WHEN (COALESCE(total_wins, 0) + COALESCE(total_draws, 0) + COALESCE(total_losses, 0)) = 0 THEN 0
                    ELSE COALESCE(total_draws::float, 0) / NULLIF(COALESCE(total_wins, 0) + COALESCE(total_draws, 0) + COALESCE(total_losses, 0), 0)
                END as avg_draw_rate,
                CASE 
                    WHEN (COALESCE(total_wins, 0) + COALESCE(total_draws, 0) + COALESCE(total_losses, 0)) = 0 THEN 0
                    ELSE COALESCE(total_losses::float, 0) / NULLIF(COALESCE(total_wins, 0) + COALESCE(total_draws, 0) + COALESCE(total_losses, 0), 0)
                END as avg_loss_rate,
                COALESCE(win_rate_stddev, 0) as win_rate_stddev,
                total_wins,
                total_draws,
                total_losses
            FROM deck_stats;

            CREATE UNIQUE INDEX commander_meta_stats_id_idx ON commander_meta_statistics(id);
            CREATE INDEX commander_meta_stats_list_idx ON commander_meta_statistics USING gin(commander_list);
            CREATE INDEX commander_meta_stats_total_wins_idx ON commander_meta_statistics(total_wins);
            CREATE INDEX commander_meta_stats_total_draws_idx ON commander_meta_statistics(total_draws);
            CREATE INDEX commander_meta_stats_total_losses_idx ON commander_meta_statistics(total_losses);
            """,
            reverse_sql="DROP MATERIALIZED VIEW IF EXISTS commander_meta_statistics;"
        ),

        # Update card_statistics_by_commander view similarly
        migrations.RunSQL(
            sql="""
            DROP MATERIALIZED VIEW IF EXISTS card_statistics_by_commander;

            CREATE MATERIALIZED VIEW card_statistics_by_commander AS
            WITH deck_card_stats AS (
                SELECT 
                    cdr.commander_list,
                    mc.unique_card_id,
                    COUNT(DISTINCT mdc.deck_id) as deck_count,
                    SUM(COALESCE(tps.wins, 0)) as total_wins,
                    SUM(COALESCE(tps.draws, 0)) as total_draws,
                    SUM(COALESCE(tps.losses, 0)) as total_losses,
                    STDDEV(
                        CASE 
                            WHEN (COALESCE(tps.wins, 0) + COALESCE(tps.draws, 0) + COALESCE(tps.losses, 0)) > 0 
                            THEN COALESCE(tps.wins, 0)::float / (COALESCE(tps.wins, 0) + COALESCE(tps.draws, 0) + COALESCE(tps.losses, 0))
                            ELSE 0 
                        END
                    ) as win_rate_stddev
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
                CASE 
                    WHEN (dcs.total_wins + dcs.total_draws + dcs.total_losses) = 0 THEN 0
                    ELSE dcs.total_wins::float / NULLIF(dcs.total_wins + dcs.total_draws + dcs.total_losses, 0)
                END as avg_win_rate,
                CASE 
                    WHEN (dcs.total_wins + dcs.total_draws + dcs.total_losses) = 0 THEN 0
                    ELSE dcs.total_draws::float / NULLIF(dcs.total_wins + dcs.total_draws + dcs.total_losses, 0)
                END as avg_draw_rate,
                CASE 
                    WHEN (dcs.total_wins + dcs.total_draws + dcs.total_losses) = 0 THEN 0
                    ELSE dcs.total_losses::float / NULLIF(dcs.total_wins + dcs.total_draws + dcs.total_losses, 0)
                END as avg_loss_rate,
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
            CREATE INDEX card_stats_total_wins_idx ON card_statistics_by_commander(total_wins);
            CREATE INDEX card_stats_total_draws_idx ON card_statistics_by_commander(total_draws);
            CREATE INDEX card_stats_total_losses_idx ON card_statistics_by_commander(total_losses);
            """,
            reverse_sql="DROP MATERIALIZED VIEW IF EXISTS card_statistics_by_commander;"
        ),

        # Update refresh function
        migrations.RunSQL(
            sql="""
            CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
            RETURNS void AS $$
            BEGIN
                REFRESH MATERIALIZED VIEW CONCURRENTLY card_printings;
                REFRESH MATERIALIZED VIEW CONCURRENTLY commander_deck_relationships;
                REFRESH MATERIALIZED VIEW CONCURRENTLY commander_meta_statistics;
                REFRESH MATERIALIZED VIEW CONCURRENTLY card_statistics_by_commander;
            END;
            $$ LANGUAGE plpgsql;
            """,
            reverse_sql="DROP FUNCTION IF EXISTS refresh_all_materialized_views;"
        ),
    ]
