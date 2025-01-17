# Generated by Django 4.2.17 on 2025-01-03 08:02

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='MoxfieldCard',
            fields=[
                ('id', models.CharField(max_length=255,
                 primary_key=True, serialize=False)),
                ('unique_card_id', models.CharField(
                    blank=True, max_length=255, null=True)),
            ],
            options={
                'db_table': 'moxfield_card',
            },
        ),
        migrations.CreateModel(
            name='MoxfieldDeck',
            fields=[
                ('id', models.CharField(max_length=255,
                 primary_key=True, serialize=False)),
                ('public_id', models.CharField(max_length=255)),
            ],
            options={
                'db_table': 'moxfield_deck',
            },
        ),
        migrations.CreateModel(
            name='TopdeckTournament',
            fields=[
                ('id', models.BigAutoField(auto_created=True,
                 primary_key=True, serialize=False, verbose_name='ID')),
                ('tid', models.CharField(max_length=255, unique=True)),
                ('swiss_num', models.IntegerField()),
                ('start_date', models.BigIntegerField()),
                ('top_cut', models.IntegerField()),
            ],
            options={
                'db_table': 'topdeck_tournament',
                'indexes': [models.Index(fields=['tid'], name='topdeck_tou_tid_a5ba7b_idx'), models.Index(fields=['start_date'], name='topdeck_tou_start_d_77b46e_idx'), models.Index(fields=['top_cut'], name='topdeck_tou_top_cut_02ea6a_idx')],
            },
        ),
        migrations.CreateModel(
            name='TopdeckPlayerStanding',
            fields=[
                ('id', models.BigAutoField(auto_created=True,
                 primary_key=True, serialize=False, verbose_name='ID')),
                ('decklist', models.URLField(blank=True, max_length=255, null=True)),
                ('wins', models.IntegerField()),
                ('draws', models.IntegerField()),
                ('losses', models.IntegerField()),
                ('win_rate', models.FloatField()),
                ('draw_rate', models.FloatField()),
                ('loss_rate', models.FloatField()),
                ('deck', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                 related_name='player_standings', to='cedhtools_backend.moxfielddeck')),
                ('tournament', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,
                 related_name='standings', to='cedhtools_backend.topdecktournament')),
            ],
            options={
                'db_table': 'topdeck_player_standing',
            },
        ),
        migrations.CreateModel(
            name='ScryfallCard',
            fields=[
                ('id', models.UUIDField(primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=255)),
                ('scryfall_uri', models.URLField(max_length=500)),
                ('layout', models.CharField(max_length=50)),
                ('type_line', models.CharField(max_length=255)),
                ('mana_cost', models.CharField(blank=True, max_length=50, null=True)),
                ('cmc', models.FloatField()),
                ('legality', models.CharField(max_length=50)),
                ('image_uris', models.JSONField(
                    blank=True, max_length=500, null=True)),
            ],
            options={
                'db_table': 'scryfall_card',
                'indexes': [models.Index(fields=['name'], name='scryfall_ca_name_7d8601_idx')],
            },
        ),
        migrations.CreateModel(
            name='MoxfieldDeckCard',
            fields=[
                ('id', models.BigAutoField(auto_created=True,
                 primary_key=True, serialize=False, verbose_name='ID')),
                ('quantity', models.IntegerField(default=1)),
                ('board', models.CharField(max_length=50)),
                ('card', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE, to='cedhtools_backend.moxfieldcard')),
                ('deck', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE, to='cedhtools_backend.moxfielddeck')),
            ],
            options={
                'db_table': 'moxfield_deck_card',
            },
        ),
        migrations.AddIndex(
            model_name='moxfielddeck',
            index=models.Index(
                fields=['id'], name='moxfield_de_id_d18690_idx'),
        ),
        migrations.AddIndex(
            model_name='moxfielddeck',
            index=models.Index(fields=['public_id'],
                               name='moxfield_de_public__8460e5_idx'),
        ),
        migrations.AddField(
            model_name='moxfieldcard',
            name='decks',
            field=models.ManyToManyField(
                related_name='cards', through='cedhtools_backend.MoxfieldDeckCard', to='cedhtools_backend.moxfielddeck'),
        ),
        migrations.AddField(
            model_name='moxfieldcard',
            name='scryfall_card',
            field=models.ForeignKey(db_column='scryfall_id', null=True, on_delete=django.db.models.deletion.SET_NULL,
                                    related_name='moxfield_cards', to='cedhtools_backend.scryfallcard'),
        ),
        migrations.AddIndex(
            model_name='topdeckplayerstanding',
            index=models.Index(
                fields=['deck'], name='topdeck_pla_deck_id_783303_idx'),
        ),
        migrations.AddIndex(
            model_name='topdeckplayerstanding',
            index=models.Index(fields=['decklist'],
                               name='topdeck_pla_decklis_6efe1b_idx'),
        ),
        migrations.AddIndex(
            model_name='topdeckplayerstanding',
            index=models.Index(fields=['tournament'],
                               name='topdeck_pla_tournam_b6864b_idx'),
        ),
        migrations.AddIndex(
            model_name='moxfielddeckcard',
            index=models.Index(fields=['deck', 'card'],
                               name='moxfield_de_deck_id_bdaa07_idx'),
        ),
        migrations.AddIndex(
            model_name='moxfieldcard',
            index=models.Index(
                fields=['unique_card_id'], name='moxfield_ca_unique__bc68ff_idx'),
        ),
        migrations.AddIndex(
            model_name='moxfieldcard',
            index=models.Index(
                fields=['id'], name='moxfield_ca_id_d30ae0_idx'),
        ),
    ]
