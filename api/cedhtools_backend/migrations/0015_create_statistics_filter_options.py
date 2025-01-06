from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        # Update this to your actual previous migration
        ('cedhtools_backend', '0014_update_commander_statistics_calculation'),
    ]

    from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('cedhtools_backend', '0014_update_commander_statistics_calculation'),
    ]

    operations = [
        # Create tournament periods table
        migrations.RunSQL(
            """
            CREATE TABLE tournament_periods (
                id SERIAL PRIMARY KEY,
                period_name VARCHAR(50) UNIQUE,
                start_timestamp BIGINT,
                end_timestamp BIGINT
            );

            -- Insert periods
            INSERT INTO tournament_periods (period_name, start_timestamp, end_timestamp) VALUES
                ('1m', EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - INTERVAL '1 month'))::BIGINT * 1000, EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)::BIGINT * 1000),
                ('3m', EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - INTERVAL '3 months'))::BIGINT * 1000, EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)::BIGINT * 1000),
                ('6m', EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - INTERVAL '6 months'))::BIGINT * 1000, EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)::BIGINT * 1000),
                ('1y', EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - INTERVAL '1 year'))::BIGINT * 1000, EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)::BIGINT * 1000),
                ('ban', EXTRACT(EPOCH FROM TIMESTAMP '2024-09-23 00:00:00')::BIGINT * 1000, EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)::BIGINT * 1000),
                ('all', 0, EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)::BIGINT * 1000);
            """,
            "DROP TABLE IF EXISTS tournament_periods CASCADE;"
        ),

        # Create tournament size thresholds table
        migrations.RunSQL(
            """
            CREATE TABLE tournament_size_thresholds (
                id SERIAL PRIMARY KEY,
                min_players INTEGER UNIQUE,
                description VARCHAR(50)
            );

            -- Insert size thresholds
            INSERT INTO tournament_size_thresholds (min_players, description) VALUES
                (0, 'all tournaments'),
                (30, '30+ players'),
                (60, '60+ players'),
                (100, '100+ players');
            """,
            "DROP TABLE IF EXISTS tournament_size_thresholds CASCADE;"
        ),

        # Create filtered commander statistics view
        migrations.RunSQL(
            """
            CREATE MATERIALIZED VIEW commander_meta_statistics_filtered AS
            WITH tournament_sizes AS (
                SELECT 
                    t.id as tournament_id,
                    COUNT(DISTINCT tps.id) as player_count
                FROM topdeck_tournament t
                JOIN topdeck_player_standing tps ON tps.tournament_id = t.id
                GROUP BY t.id
            ),
            deck_stats AS (
                SELECT 
                    cdr.commander_list::varchar[] as commander_list,
                    tp.period_name,
                    tst.min_players,
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
                LEFT JOIN topdeck_tournament t ON tps.tournament_id = t.id
                JOIN tournament_sizes ts ON t.id = ts.tournament_id
                CROSS JOIN tournament_periods tp
                CROSS JOIN tournament_size_thresholds tst
                WHERE 
                    (t.start_date * 1000) BETWEEN tp.start_timestamp AND tp.end_timestamp
                    AND ts.player_count >= tst.min_players
                GROUP BY cdr.commander_list, tp.period_name, tst.min_players
            )
            SELECT 
                ROW_NUMBER() OVER () as id,
                commander_list,
                period_name,
                min_players as min_tournament_size,
                total_decks,
                COALESCE(total_wins::float / NULLIF(total_wins + total_draws + total_losses, 0), 0) as avg_win_rate,
                COALESCE(total_draws::float / NULLIF(total_wins + total_draws + total_losses, 0), 0) as avg_draw_rate,
                COALESCE(total_losses::float / NULLIF(total_wins + total_draws + total_losses, 0), 0) as avg_loss_rate,
                COALESCE(win_rate_stddev, 0) as win_rate_stddev,
                total_wins,
                total_draws,
                total_losses
            FROM deck_stats;

            CREATE UNIQUE INDEX commander_meta_stats_filtered_id_idx ON commander_meta_statistics_filtered(id);
            CREATE INDEX commander_meta_stats_filtered_list_idx ON commander_meta_statistics_filtered USING gin(commander_list);
            CREATE INDEX commander_meta_stats_filtered_period_idx ON commander_meta_statistics_filtered(period_name);
            CREATE INDEX commander_meta_stats_filtered_size_idx ON commander_meta_statistics_filtered(min_tournament_size);
            """,
            "DROP MATERIALIZED VIEW IF EXISTS commander_meta_statistics_filtered CASCADE;"
        ),

        # Create filtered card statistics view
        migrations.RunSQL(
            """
            CREATE MATERIALIZED VIEW card_statistics_by_commander_filtered AS
            WITH tournament_sizes AS (
                SELECT 
                    t.id as tournament_id,
                    COUNT(DISTINCT tps.id) as player_count
                FROM topdeck_tournament t
                JOIN topdeck_player_standing tps ON tps.tournament_id = t.id
                GROUP BY t.id
            ),
            deck_card_stats AS (
                SELECT 
                    cdr.commander_list::varchar[] as commander_list,
                    mc.unique_card_id,
                    tp.period_name,
                    tst.min_players,
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
                LEFT JOIN topdeck_tournament t ON tps.tournament_id = t.id
                JOIN tournament_sizes ts ON t.id = ts.tournament_id
                CROSS JOIN tournament_periods tp
                CROSS JOIN tournament_size_thresholds tst
                WHERE 
                    mdc.board = 'mainboard'
                    AND (t.start_date * 1000) BETWEEN tp.start_timestamp AND tp.end_timestamp
                    AND ts.player_count >= tst.min_players
                GROUP BY cdr.commander_list, mc.unique_card_id, tp.period_name, tst.min_players
            )
            SELECT 
                ROW_NUMBER() OVER () as id,
                dcs.*,
                COALESCE(dcs.total_wins::float / NULLIF(dcs.total_wins + dcs.total_draws + dcs.total_losses, 0), 0) as avg_win_rate,
                COALESCE(dcs.total_draws::float / NULLIF(dcs.total_wins + dcs.total_draws + dcs.total_losses, 0), 0) as avg_draw_rate,
                COALESCE(dcs.total_losses::float / NULLIF(dcs.total_wins + dcs.total_draws + dcs.total_losses, 0), 0) as avg_loss_rate,
                mc.scryfall_id as most_common_printing
            FROM deck_card_stats dcs
            JOIN card_printings cp ON dcs.unique_card_id = cp.unique_card_id
            JOIN moxfield_card mc ON dcs.unique_card_id = mc.unique_card_id 
                AND mc.scryfall_id = cp.most_common_printing
            WHERE dcs.deck_count >= 5;

            CREATE UNIQUE INDEX card_stats_commander_filtered_id_idx ON card_statistics_by_commander_filtered(id);
            CREATE INDEX card_stats_commander_filtered_list_idx ON card_statistics_by_commander_filtered USING gin(commander_list);
            CREATE INDEX card_stats_commander_filtered_period_idx ON card_statistics_by_commander_filtered(period_name);
            CREATE INDEX card_stats_commander_filtered_size_idx ON card_statistics_by_commander_filtered(min_players);
            """,
            "DROP MATERIALIZED VIEW IF EXISTS card_statistics_by_commander_filtered CASCADE;"
        ),

        # Update functions
        migrations.RunSQL(
            """
            CREATE OR REPLACE FUNCTION update_tournament_periods()
            RETURNS void AS $$
            BEGIN
                UPDATE tournament_periods 
                SET 
                    start_timestamp = CASE period_name
                        WHEN '1m' THEN EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - INTERVAL '1 month'))::BIGINT * 1000
                        WHEN '3m' THEN EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - INTERVAL '3 months'))::BIGINT * 1000
                        WHEN '6m' THEN EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - INTERVAL '6 months'))::BIGINT * 1000
                        WHEN '1y' THEN EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - INTERVAL '1 year'))::BIGINT * 1000
                        WHEN 'ban' THEN EXTRACT(EPOCH FROM TIMESTAMP '2024-09-23 00:00:00')::BIGINT * 1000
                        WHEN 'all' THEN 0
                        ELSE start_timestamp
                    END,
                    end_timestamp = EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)::BIGINT * 1000;
            END;
            $$ LANGUAGE plpgsql;

            CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
            RETURNS void AS $$
            BEGIN
                -- Update the time periods first
                PERFORM update_tournament_periods();
                
                -- Then refresh the views
                REFRESH MATERIALIZED VIEW CONCURRENTLY card_printings;
                REFRESH MATERIALIZED VIEW CONCURRENTLY commander_deck_relationships;
                REFRESH MATERIALIZED VIEW CONCURRENTLY commander_meta_statistics;
                REFRESH MATERIALIZED VIEW CONCURRENTLY commander_meta_statistics_filtered;
                REFRESH MATERIALIZED VIEW CONCURRENTLY card_statistics_by_commander;
                REFRESH MATERIALIZED VIEW CONCURRENTLY card_statistics_by_commander_filtered;
            END;
            $$ LANGUAGE plpgsql;
            """,
            """
            DROP FUNCTION IF EXISTS update_tournament_periods();
            DROP FUNCTION IF EXISTS refresh_all_materialized_views();
            """
        ),
    ]
