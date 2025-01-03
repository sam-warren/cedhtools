# Generated by Django 4.2.17 on 2024-12-20 07:44

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cedhtools_backend', '0024_cardstatsweekly_commandercardstats_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='ScryfallCard',
            fields=[
                ('scryfall_id', models.UUIDField(primary_key=True, serialize=False)),
                ('oracle_id', models.UUIDField()),
                ('name', models.CharField(max_length=255)),
                ('lang', models.CharField(max_length=10)),
                ('released_at', models.DateField()),
                ('set_name', models.CharField(max_length=255)),
                ('collector_number', models.CharField(max_length=50)),
                ('rarity', models.CharField(max_length=50)),
                ('uri', models.URLField()),
                ('scryfall_uri', models.URLField()),
                ('image_uris', models.JSONField(blank=True, default=dict)),
                ('mana_cost', models.CharField(blank=True, max_length=50)),
                ('cmc', models.FloatField()),
                ('type_line', models.CharField(max_length=255)),
                ('oracle_text', models.TextField(blank=True, null=True)),
                ('power', models.CharField(blank=True, max_length=10, null=True)),
                ('toughness', models.CharField(blank=True, max_length=10, null=True)),
                ('colors', models.JSONField(blank=True, default=list)),
                ('color_identity', models.JSONField(blank=True, default=list)),
                ('legalities', models.JSONField(blank=True, default=dict)),
                ('prices', models.JSONField(blank=True, default=dict)),
                ('digital', models.BooleanField(default=False)),
                ('reprint', models.BooleanField(default=False)),
                ('full_art', models.BooleanField(default=False)),
                ('textless', models.BooleanField(default=False)),
                ('set_id', models.UUIDField()),
            ],
            options={
                'db_table': 'scryfall_card',
                'indexes': [models.Index(fields=['scryfall_id'], name='scryfall_ca_scryfal_7ddfb4_idx')],
            },
        ),
    ]
