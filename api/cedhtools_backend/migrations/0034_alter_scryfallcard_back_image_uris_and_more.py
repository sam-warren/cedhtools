# Generated by Django 4.2.17 on 2024-12-20 18:42

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cedhtools_backend', '0033_scryfallcard_back_image_uris_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='scryfallcard',
            name='back_image_uris',
            field=models.JSONField(blank=True, default=dict, null=True),
        ),
        migrations.AlterField(
            model_name='scryfallcard',
            name='image_uris',
            field=models.JSONField(blank=True, default=dict, null=True),
        ),
    ]
