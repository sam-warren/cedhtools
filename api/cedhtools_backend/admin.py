from django.contrib import admin
from .models import *

admin.site.register(MoxfieldAuthor)
admin.site.register(MoxfieldCard)
admin.site.register(MoxfieldDeck)
admin.site.register(MoxfieldBoard)
admin.site.register(MoxfieldBoardCard)
admin.site.register(MoxfieldHub)

admin.site.register(TopdeckTournament)
admin.site.register(TopdeckPlayerStanding)

admin.site.register(ScryfallCard)
admin.site.register(ScryfallCardFace)
