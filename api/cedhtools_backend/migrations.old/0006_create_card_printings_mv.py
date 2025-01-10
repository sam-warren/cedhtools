from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        # Replace with your app name and previous migration
        ('cedhtools_backend', '0005_cardstatisticsbycommander_cedhtoolsmetrics_and_more'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
            CREATE MATERIALIZED VIEW card_printings AS
            WITH printing_counts AS (
                SELECT 
                    mc.unique_card_id,
                    mc.scryfall_id,
                    COUNT(*) as usage_count,
                    ROW_NUMBER() OVER (
                        PARTITION BY mc.unique_card_id 
                        ORDER BY COUNT(*) DESC, mc.scryfall_id
                    ) as rank
                FROM moxfield_card mc
                JOIN moxfield_deck_card mdc ON mc.id = mdc.card_id
                WHERE mc.unique_card_id IS NOT NULL
                AND mc.scryfall_id IS NOT NULL
                GROUP BY mc.unique_card_id, mc.scryfall_id
            )
            SELECT 
                unique_card_id,
                scryfall_id as most_common_printing,
                usage_count
            FROM printing_counts
            WHERE rank = 1;
            
            CREATE UNIQUE INDEX card_printings_unique_card_id_idx 
            ON card_printings (unique_card_id);
            """,
            reverse_sql='DROP MATERIALIZED VIEW IF EXISTS card_printings;'
        ),
    ]
