# Generated by Django 4.2.17 on 2024-12-31 02:30

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cedhtools_backend', '0002_scryfallcard_uri'),
    ]

    operations = [
        migrations.AlterField(
            model_name='scryfallcardface',
            name='cmc',
            field=models.FloatField(blank=True, help_text='The mana value of this particular face, if the card is reversible.', null=True),
        ),
    ]
