# Generated by Django 4.2.17 on 2024-12-27 07:34

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('cedhtools_backend', '0036_scryfallcardface_remove_scryfallcard_back_image_uris_and_more'),
    ]

    operations = [
        migrations.DeleteModel(
            name='CardStatsWeekly',
        ),
        migrations.DeleteModel(
            name='CommanderCardStats',
        ),
        migrations.DeleteModel(
            name='CommanderStatsWeekly',
        ),
        migrations.DeleteModel(
            name='DeckCards',
        ),
        migrations.DeleteModel(
            name='PlayerStandings',
        ),
        migrations.DeleteModel(
            name='TournamentSummary',
        ),
    ]
