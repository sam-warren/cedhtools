from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('cedhtools_backend', '0010_add_card_statistics_view'),
    ]

    operations = [
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
