# Generated by Django 4.2.17 on 2024-12-13 21:31

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cedhtools_backend', '0016_moxfieldboardcard_topdeckplayerstanding_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='MoxfieldHub',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255, unique=True)),
                ('description', models.TextField(blank=True)),
            ],
        ),
        migrations.CreateModel(
            name='MoxfieldMedia',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('url', models.URLField(max_length=1024)),
                ('media_type', models.CharField(max_length=50)),
                ('description', models.TextField(blank=True)),
            ],
        ),
        migrations.AddField(
            model_name='moxfielddeck',
            name='affiliates',
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name='moxfielddeck',
            name='allow_primer_clone',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='moxfielddeck',
            name='author_tags',
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name='moxfielddeck',
            name='cards_to_tokens',
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name='moxfielddeck',
            name='color_identity',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name='moxfielddeck',
            name='color_identity_percentages',
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name='moxfielddeck',
            name='color_percentages',
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name='moxfielddeck',
            name='colors',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name='moxfielddeck',
            name='commander_tier',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='moxfielddeck',
            name='created_at_utc',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='moxfielddeck',
            name='deck_tier',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='moxfielddeck',
            name='deck_tier1_count',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='moxfielddeck',
            name='deck_tier2_count',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='moxfielddeck',
            name='deck_tier3_count',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='moxfielddeck',
            name='deck_tier4_count',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='moxfielddeck',
            name='enable_multiple_printings',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='moxfielddeck',
            name='export_id',
            field=models.UUIDField(editable=False, null=True, unique=True),
        ),
        migrations.AddField(
            model_name='moxfielddeck',
            name='include_basic_lands_in_price',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='moxfielddeck',
            name='include_commanders_in_price',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='moxfielddeck',
            name='include_signature_spells_in_price',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='moxfielddeck',
            name='is_too_beaucoup',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='moxfielddeck',
            name='last_updated_at_utc',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='moxfielddeck',
            name='main_card_id_is_back_face',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='moxfielddeck',
            name='token_mappings',
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name='moxfielddeck',
            name='tokens_to_cards',
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name='moxfielddeck',
            name='version',
            field=models.IntegerField(default=1),
        ),
        migrations.AddField(
            model_name='moxfielddeck',
            name='hubs',
            field=models.ManyToManyField(blank=True, related_name='decks', to='cedhtools_backend.moxfieldhub'),
        ),
        migrations.AddField(
            model_name='moxfielddeck',
            name='media',
            field=models.ManyToManyField(blank=True, related_name='decks', to='cedhtools_backend.moxfieldmedia'),
        ),
    ]
