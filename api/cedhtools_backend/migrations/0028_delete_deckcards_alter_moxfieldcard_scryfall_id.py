# Generated by Django 4.2.17 on 2024-12-20 15:57

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cedhtools_backend', '0027_alter_scryfallcard_name_and_more'),
    ]

    operations = [
        migrations.DeleteModel(
            name='DeckCards',
        ),
        migrations.AlterField(
            model_name='moxfieldcard',
            name='scryfall_id',
            field=models.UUIDField(blank=True, null=True),
        ),
    ]
