# Generated by Django 4.2.17 on 2024-12-20 18:33

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cedhtools_backend', '0031_remove_scryfallcard_scryfall_ca_image_u_33fdf0_idx_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='scryfallcard',
            name='scryfall_id',
            field=models.UUIDField(primary_key=True, serialize=False),
        ),
    ]
