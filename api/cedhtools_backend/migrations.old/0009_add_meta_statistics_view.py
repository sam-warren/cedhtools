from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('cedhtools_backend', '0008_add_indices'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
            CREATE MATERIALIZED VIEW commander_meta_statistics AS
            WITH deck_stats AS (
                SELECT 
                    cdr.commander_list,
                    COUNT(DISTINCT tps.deck_id) as total_decks,
                    AVG(tps.win_rate) as avg_win_rate,
                    AVG(tps.draw_rate) as avg_draw_rate,
                    AVG(tps.loss_rate) as avg_loss_rate,
                    STDDEV(tps.win_rate) as win_rate_stddev
                FROM commander_deck_relationships cdr
                LEFT JOIN topdeck_player_standing tps ON cdr.deck_id = tps.deck_id
                GROUP BY cdr.commander_list
            )
            SELECT 
                ROW_NUMBER() OVER () as id,
                commander_list,
                total_decks,
                COALESCE(avg_win_rate, 0) as avg_win_rate,
                COALESCE(avg_draw_rate, 0) as avg_draw_rate,
                COALESCE(avg_loss_rate, 0) as avg_loss_rate,
                COALESCE(win_rate_stddev, 0) as win_rate_stddev
            FROM deck_stats;

            CREATE UNIQUE INDEX commander_meta_stats_id_idx ON commander_meta_statistics(id);
            CREATE INDEX commander_meta_stats_list_idx ON commander_meta_statistics USING gin(commander_list);
            """,
            reverse_sql="DROP MATERIALIZED VIEW IF EXISTS commander_meta_statistics;"
        ),
    ]
