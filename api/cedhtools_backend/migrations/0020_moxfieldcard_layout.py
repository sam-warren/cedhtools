# Generated by Django 4.2.17 on 2024-12-13 22:30

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cedhtools_backend', '0019_remove_moxfieldcard_cedhtools_b_set_a8cdf1_idx_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='moxfieldcard',
            name='layout',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
    ]
