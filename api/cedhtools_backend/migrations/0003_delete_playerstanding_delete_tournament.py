# Generated by Django 4.2.17 on 2024-12-12 23:00

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('cedhtools_backend', '0002_alter_playerstanding_decklist'),
    ]

    operations = [
        migrations.DeleteModel(
            name='PlayerStanding',
        ),
        migrations.DeleteModel(
            name='Tournament',
        ),
    ]
