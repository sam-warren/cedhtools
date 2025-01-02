from django.contrib import admin
from .models import *

admin.site.register(MoxfieldCard)
admin.site.register(MoxfieldDeck)

admin.site.register(TopdeckTournament)
admin.site.register(TopdeckPlayerStanding)
