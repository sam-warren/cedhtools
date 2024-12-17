# Generated by Django 4.2.17 on 2024-12-17 17:01

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cedhtools_backend', '0022_topdeckplayerstanding_cedhtools_b_player__bf93ac_idx'),
    ]

    operations = [
        migrations.RemoveIndex(
            model_name='moxfieldcard',
            name='cedhtools_b_scryfal_07aa6c_idx',
        ),
        migrations.RemoveIndex(
            model_name='moxfieldcard',
            name='cedhtools_b_set_cod_b69ebc_idx',
        ),
        migrations.AddIndex(
            model_name='moxfieldboard',
            index=models.Index(fields=['deck'], name='cedhtools_b_deck_id_4a2c5f_idx'),
        ),
        migrations.AddIndex(
            model_name='moxfieldboardcard',
            index=models.Index(fields=['board'], name='cedhtools_b_board_i_79d262_idx'),
        ),
        migrations.AddIndex(
            model_name='moxfieldboardcard',
            index=models.Index(fields=['card'], name='cedhtools_b_card_id_cdd849_idx'),
        ),
        migrations.AddIndex(
            model_name='moxfieldcard',
            index=models.Index(fields=['unique_card_id'], name='cedhtools_b_unique__384fe3_idx'),
        ),
    ]
