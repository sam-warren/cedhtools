# Generated by Django 4.2.17 on 2025-01-03 21:57

import django.contrib.postgres.fields
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cedhtools_backend', '0004_create_card_stats_mv'),
    ]

    operations = [
        migrations.CreateModel(
            name='CardStatisticsByCommander',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('commander_list', django.contrib.postgres.fields.ArrayField(base_field=models.CharField(max_length=255), size=None)),
                ('card_id', models.CharField(max_length=255)),
                ('unique_card_id', models.CharField(max_length=255)),
                ('deck_count', models.IntegerField()),
                ('avg_win_rate', models.FloatField()),
                ('avg_draw_rate', models.FloatField()),
                ('avg_loss_rate', models.FloatField()),
            ],
            options={
                'db_table': 'card_statistics_by_commander',
                'managed': False,
            },
        ),
        migrations.CreateModel(
            name='CEDHToolsMetrics',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('total_decks', models.IntegerField()),
                ('total_tournaments', models.IntegerField()),
                ('total_unique_cards', models.IntegerField()),
            ],
            options={
                'db_table': 'cedhtools_metrics',
                'managed': False,
            },
        ),
        migrations.CreateModel(
            name='CommanderDeckRelationships',
            fields=[
                ('deck_id', models.CharField(max_length=255, primary_key=True, serialize=False)),
                ('commander_list', django.contrib.postgres.fields.ArrayField(base_field=models.CharField(max_length=255), size=None)),
            ],
            options={
                'db_table': 'commander_deck_relationships',
                'managed': False,
            },
        ),
    ]
