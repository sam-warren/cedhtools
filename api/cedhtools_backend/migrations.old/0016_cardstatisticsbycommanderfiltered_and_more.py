# Generated by Django 4.2.17 on 2025-01-10 09:30

import cedhtools_backend.models.topdeck_models
import django.contrib.postgres.fields
import django.core.validators
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('cedhtools_backend', '0015_create_statistics_filter_options'),
    ]

    operations = [
        migrations.CreateModel(
            name='CardStatisticsByCommanderFiltered',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('commander_list', django.contrib.postgres.fields.ArrayField(base_field=models.CharField(max_length=255), size=None)),
                ('unique_card_id', models.CharField(max_length=255)),
                ('period_name', models.CharField(max_length=50)),
                ('min_players', models.IntegerField()),
                ('deck_count', models.IntegerField()),
                ('total_wins', models.IntegerField()),
                ('total_draws', models.IntegerField()),
                ('total_losses', models.IntegerField()),
                ('win_rate_stddev', models.FloatField()),
                ('avg_win_rate', models.FloatField()),
                ('avg_draw_rate', models.FloatField()),
                ('avg_loss_rate', models.FloatField()),
                ('most_common_printing', models.CharField(max_length=255)),
            ],
            options={
                'db_table': 'card_statistics_by_commander_filtered',
                'managed': False,
            },
        ),
        migrations.CreateModel(
            name='CommanderMetaStatisticsFiltered',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('commander_list', django.contrib.postgres.fields.ArrayField(base_field=models.CharField(max_length=255), size=None)),
                ('period_name', models.CharField(max_length=50)),
                ('min_tournament_size', models.IntegerField()),
                ('total_decks', models.IntegerField()),
                ('avg_win_rate', models.FloatField()),
                ('avg_draw_rate', models.FloatField()),
                ('avg_loss_rate', models.FloatField()),
                ('win_rate_stddev', models.FloatField()),
                ('total_wins', models.IntegerField()),
                ('total_draws', models.IntegerField()),
                ('total_losses', models.IntegerField()),
            ],
            options={
                'db_table': 'commander_meta_statistics_filtered',
                'managed': False,
            },
        ),
        migrations.CreateModel(
            name='TopdeckMatch',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('round', models.CharField(max_length=255)),
                ('table_number', models.IntegerField()),
                ('status', models.CharField(max_length=255)),
                ('is_draw', models.BooleanField(default=False)),
                ('is_top_cut', models.BooleanField(default=False)),
                ('pod_size', models.IntegerField(validators=[django.core.validators.MinValueValidator(3), django.core.validators.MaxValueValidator(4)])),
            ],
            options={
                'db_table': 'topdeck_match',
            },
            bases=(models.Model, cedhtools_backend.models.topdeck_models.QuerySetMixin),
        ),
        migrations.CreateModel(
            name='TopdeckMatchPlayer',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('seat_position', models.IntegerField(validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(4)])),
            ],
            options={
                'db_table': 'topdeck_match_player',
            },
            bases=(models.Model, cedhtools_backend.models.topdeck_models.QuerySetMixin),
        ),
        migrations.CreateModel(
            name='TopdeckPlayer',
            fields=[
                ('topdeck_id', models.CharField(max_length=255, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=511)),
                ('first_seen_date', models.BigIntegerField()),
                ('last_seen_date', models.BigIntegerField()),
            ],
            options={
                'db_table': 'topdeck_player',
            },
            bases=(models.Model, cedhtools_backend.models.topdeck_models.QuerySetMixin),
        ),
        migrations.AlterModelOptions(
            name='topdeckplayerstanding',
            options={'ordering': ['standing_position']},
        ),
        migrations.RemoveIndex(
            model_name='topdeckplayerstanding',
            name='topdeck_pla_deck_id_783303_idx',
        ),
        migrations.RemoveIndex(
            model_name='topdeckplayerstanding',
            name='topdeck_pla_decklis_6efe1b_idx',
        ),
        migrations.RemoveIndex(
            model_name='topdeckplayerstanding',
            name='topdeck_pla_tournam_b6864b_idx',
        ),
        migrations.RemoveIndex(
            model_name='topdecktournament',
            name='topdeck_tou_top_cut_02ea6a_idx',
        ),
        migrations.RemoveField(
            model_name='topdecktournament',
            name='id',
        ),
        migrations.AddField(
            model_name='topdeckplayerstanding',
            name='byes',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='topdeckplayerstanding',
            name='losses_bracket',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='topdeckplayerstanding',
            name='losses_swiss',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='topdeckplayerstanding',
            name='standing_position',
            field=models.IntegerField(default=0),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='topdeckplayerstanding',
            name='wins_bracket',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='topdeckplayerstanding',
            name='wins_swiss',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='topdecktournament',
            name='average_elo',
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='topdecktournament',
            name='median_elo',
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='topdecktournament',
            name='mode_elo',
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='topdecktournament',
            name='name',
            field=models.CharField(blank=True, max_length=511, null=True),
        ),
        migrations.AddField(
            model_name='topdecktournament',
            name='top_elo',
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='topdecktournament',
            name='tournament_size',
            field=models.IntegerField(default=0, validators=[django.core.validators.MinValueValidator(3)]),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name='topdeckplayerstanding',
            name='draws',
            field=models.IntegerField(default=0),
        ),
        migrations.AlterField(
            model_name='topdeckplayerstanding',
            name='losses',
            field=models.IntegerField(default=0),
        ),
        migrations.AlterField(
            model_name='topdeckplayerstanding',
            name='wins',
            field=models.IntegerField(default=0),
        ),
        migrations.AlterField(
            model_name='topdecktournament',
            name='tid',
            field=models.CharField(max_length=255, primary_key=True, serialize=False),
        ),
        migrations.AddIndex(
            model_name='topdeckplayerstanding',
            index=models.Index(fields=['tournament', 'player'], name='topdeck_pla_tournam_3a0149_idx'),
        ),
        migrations.AddIndex(
            model_name='topdeckplayerstanding',
            index=models.Index(fields=['player', 'deck'], name='topdeck_pla_player__0094c4_idx'),
        ),
        migrations.AddIndex(
            model_name='topdeckplayerstanding',
            index=models.Index(fields=['tournament', 'player', 'standing_position'], name='topdeck_pla_tournam_29512e_idx'),
        ),
        migrations.AddIndex(
            model_name='topdeckplayerstanding',
            index=models.Index(fields=['tournament', 'player', 'deck'], name='topdeck_pla_tournam_cb1926_idx'),
        ),
        migrations.AddIndex(
            model_name='topdeckplayerstanding',
            index=models.Index(fields=['player', 'standing_position'], name='topdeck_pla_player__726012_idx'),
        ),
        migrations.AddIndex(
            model_name='topdecktournament',
            index=models.Index(fields=['tournament_size'], name='topdeck_tou_tournam_bbe4ac_idx'),
        ),
        migrations.AddIndex(
            model_name='topdecktournament',
            index=models.Index(fields=['tournament_size', 'start_date'], name='topdeck_tou_tournam_0ef0a5_idx'),
        ),
        migrations.AddIndex(
            model_name='topdeckplayer',
            index=models.Index(fields=['name'], name='topdeck_pla_name_a8192e_idx'),
        ),
        migrations.AddIndex(
            model_name='topdeckplayer',
            index=models.Index(fields=['last_seen_date', 'topdeck_id'], name='topdeck_pla_last_se_6aac20_idx'),
        ),
        migrations.AddField(
            model_name='topdeckmatchplayer',
            name='match',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='players', to='cedhtools_backend.topdeckmatch'),
        ),
        migrations.AddField(
            model_name='topdeckmatchplayer',
            name='player',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='match_appearances', to='cedhtools_backend.topdeckplayer'),
        ),
        migrations.AddField(
            model_name='topdeckmatchplayer',
            name='standing',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='match_appearances', to='cedhtools_backend.topdeckplayerstanding'),
        ),
        migrations.AddField(
            model_name='topdeckmatch',
            name='tournament',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='matches', to='cedhtools_backend.topdecktournament'),
        ),
        migrations.AddField(
            model_name='topdeckmatch',
            name='winner',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='matches_won', to='cedhtools_backend.topdeckplayer'),
        ),
        migrations.AddField(
            model_name='topdeckplayerstanding',
            name='player',
            field=models.ForeignKey(default=0, on_delete=django.db.models.deletion.CASCADE, related_name='standings', to='cedhtools_backend.topdeckplayer'),
            preserve_default=False,
        ),
        migrations.AlterUniqueTogether(
            name='topdeckplayerstanding',
            unique_together={('tournament', 'standing_position'), ('tournament', 'player')},
        ),
        migrations.AddIndex(
            model_name='topdeckmatchplayer',
            index=models.Index(fields=['match', 'player'], name='topdeck_mat_match_i_e42073_idx'),
        ),
        migrations.AddIndex(
            model_name='topdeckmatchplayer',
            index=models.Index(fields=['player'], name='topdeck_mat_player__e5421a_idx'),
        ),
        migrations.AddIndex(
            model_name='topdeckmatchplayer',
            index=models.Index(fields=['standing'], name='topdeck_mat_standin_e99163_idx'),
        ),
        migrations.AlterUniqueTogether(
            name='topdeckmatchplayer',
            unique_together={('match', 'player'), ('match', 'seat_position')},
        ),
        migrations.AddIndex(
            model_name='topdeckmatch',
            index=models.Index(fields=['tournament', 'round', 'table_number'], name='topdeck_mat_tournam_e0b93d_idx'),
        ),
        migrations.AddIndex(
            model_name='topdeckmatch',
            index=models.Index(fields=['tournament', 'winner'], name='topdeck_mat_tournam_dce02a_idx'),
        ),
        migrations.AddIndex(
            model_name='topdeckmatch',
            index=models.Index(fields=['tournament', 'is_draw'], name='topdeck_mat_tournam_7f56d9_idx'),
        ),
        migrations.AddIndex(
            model_name='topdeckmatch',
            index=models.Index(fields=['tournament', 'is_top_cut'], name='topdeck_mat_tournam_d450ce_idx'),
        ),
        migrations.AddIndex(
            model_name='topdeckmatch',
            index=models.Index(fields=['tournament', 'pod_size'], name='topdeck_mat_tournam_e96aaf_idx'),
        ),
        migrations.AddIndex(
            model_name='topdeckmatch',
            index=models.Index(fields=['tournament', 'status'], name='topdeck_mat_tournam_ca50cf_idx'),
        ),
        migrations.AlterUniqueTogether(
            name='topdeckmatch',
            unique_together={('tournament', 'round', 'table_number')},
        ),
        migrations.RemoveField(
            model_name='topdeckplayerstanding',
            name='draw_rate',
        ),
        migrations.RemoveField(
            model_name='topdeckplayerstanding',
            name='loss_rate',
        ),
        migrations.RemoveField(
            model_name='topdeckplayerstanding',
            name='win_rate',
        ),
    ]
