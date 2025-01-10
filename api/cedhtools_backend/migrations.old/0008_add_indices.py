from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('cedhtools_backend', '0007_cardprintings'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
            -- Add composite indices for common query patterns
            CREATE INDEX IF NOT EXISTS idx_moxfield_deck_card_board_composite 
            ON moxfield_deck_card(deck_id, card_id, board);

            CREATE INDEX IF NOT EXISTS idx_topdeck_player_standing_performance 
            ON topdeck_player_standing(deck_id, win_rate, draws, losses);

            -- Add partial indices for common filters
            CREATE INDEX IF NOT EXISTS idx_moxfield_deck_card_commanders 
            ON moxfield_deck_card(deck_id, card_id) 
            WHERE board = 'commanders';

            CREATE INDEX IF NOT EXISTS idx_moxfield_deck_card_mainboard 
            ON moxfield_deck_card(deck_id, card_id) 
            WHERE board = 'mainboard';

            -- Add monitoring indices
            CREATE INDEX IF NOT EXISTS idx_moxfield_card_lookup 
            ON moxfield_card(unique_card_id, scryfall_id) 
            INCLUDE (id);

            CREATE INDEX IF NOT EXISTS idx_scryfall_card_details 
            ON scryfall_card(id) 
            INCLUDE (name, type_line, cmc, mana_cost, image_uris, legality, scryfall_uri);
            """,
            reverse_sql="""
            DROP INDEX IF EXISTS idx_scryfall_card_details;
            DROP INDEX IF EXISTS idx_moxfield_card_lookup;
            DROP INDEX IF EXISTS idx_moxfield_deck_card_mainboard;
            DROP INDEX IF EXISTS idx_moxfield_deck_card_commanders;
            DROP INDEX IF EXISTS idx_topdeck_player_standing_performance;
            DROP INDEX IF EXISTS idx_moxfield_deck_card_board_composite;
            """
        ),
    ]
