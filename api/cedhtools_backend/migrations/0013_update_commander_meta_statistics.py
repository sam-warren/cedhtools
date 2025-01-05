from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('cedhtools_backend', '0012_commandermetastatistics'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
            DROP MATERIALIZED VIEW IF EXISTS commander_meta_statistics;
            
            CREATE MATERIALIZED VIEW commander_meta_statistics AS
            WITH deck_stats AS (
                SELECT 
                    cdr.commander_list,
                    COUNT(DISTINCT tps.deck_id) as total_decks,
                    SUM(tps.wins) as total_wins,
                    SUM(tps.draws) as total_draws,
                    SUM(tps.losses) as total_losses,
                    STDDEV(tps.win_rate) as win_rate_stddev  -- Keeping this for now
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
                COALESCE(win_rate_stddev, 0) as win_rate_stddev
            FROM deck_stats;

            CREATE UNIQUE INDEX commander_meta_stats_id_idx ON commander_meta_statistics(id);
            CREATE INDEX commander_meta_stats_list_idx ON commander_meta_statistics USING gin(commander_list);
            """,
            reverse_sql="DROP MATERIALIZED VIEW IF EXISTS commander_meta_statistics;"
        ),
    ]
