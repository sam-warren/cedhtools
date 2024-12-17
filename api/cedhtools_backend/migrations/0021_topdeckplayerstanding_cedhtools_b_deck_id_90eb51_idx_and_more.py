# Generated by Django 4.2.17 on 2024-12-17 16:39

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cedhtools_backend', '0020_moxfieldcard_layout'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='topdeckplayerstanding',
            index=models.Index(fields=['deck'], name='cedhtools_b_deck_id_90eb51_idx'),
        ),
        migrations.AddIndex(
            model_name='topdeckplayerstanding',
            index=models.Index(fields=['decklist'], name='cedhtools_b_decklis_406cf0_idx'),
        ),
        migrations.AddIndex(
            model_name='topdeckplayerstanding',
            index=models.Index(fields=['tournament'], name='cedhtools_b_tournam_7a2dc6_idx'),
        ),
        migrations.AddIndex(
            model_name='topdecktournament',
            index=models.Index(fields=['tid'], name='cedhtools_b_tid_9494ba_idx'),
        ),
        migrations.AddIndex(
            model_name='topdecktournament',
            index=models.Index(fields=['start_date'], name='cedhtools_b_start_d_3e340d_idx'),
        ),
        migrations.AddIndex(
            model_name='topdecktournament',
            index=models.Index(fields=['game'], name='cedhtools_b_game_ce18c1_idx'),
        ),
        migrations.AddIndex(
            model_name='topdecktournament',
            index=models.Index(fields=['format'], name='cedhtools_b_format_debeeb_idx'),
        ),
    ]
