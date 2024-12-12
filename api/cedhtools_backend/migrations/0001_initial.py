# Generated by Django 4.2.17 on 2024-12-12 20:23

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Tournament',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('tid', models.CharField(max_length=100, unique=True)),
                ('tournament_name', models.CharField(max_length=255)),
                ('swiss_num', models.IntegerField()),
                ('start_date', models.BigIntegerField()),
                ('game', models.CharField(max_length=100)),
                ('format', models.CharField(max_length=100)),
                ('top_cut', models.IntegerField()),
            ],
        ),
        migrations.CreateModel(
            name='PlayerStanding',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('decklist', models.URLField(blank=True, max_length=255, null=True)),
                ('wins', models.IntegerField(default=0)),
                ('wins_swiss', models.IntegerField(default=0)),
                ('wins_bracket', models.IntegerField(default=0)),
                ('win_rate', models.FloatField(blank=True, null=True)),
                ('win_rate_swiss', models.FloatField(blank=True, null=True)),
                ('win_rate_bracket', models.FloatField(blank=True, null=True)),
                ('draws', models.IntegerField(default=0)),
                ('losses', models.IntegerField(default=0)),
                ('losses_swiss', models.IntegerField(default=0)),
                ('losses_bracket', models.IntegerField(default=0)),
                ('player_id', models.CharField(blank=True, max_length=255, null=True)),
                ('tournament', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='standings', to='cedhtools_backend.tournament')),
            ],
        ),
    ]
