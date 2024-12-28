# schema.py

import graphene
from graphene_django import DjangoObjectType

# Import your models from wherever they live in your project
from ..models import (
    MoxfieldAuthor,
    MoxfieldCard,
    MoxfieldDeck,
    MoxfieldHub,
    MoxfieldBoard,
    MoxfieldBoardCard,
    ScryfallCard,
    ScryfallCardFace,
    TopdeckTournament,
    TopdeckPlayerStanding,
)


# ----- Moxfield DjangoObjectTypes -----

class MoxfieldAuthorType(DjangoObjectType):
    class Meta:
        model = MoxfieldAuthor
        fields = "__all__"


class MoxfieldCardType(DjangoObjectType):
    class Meta:
        model = MoxfieldCard
        fields = "__all__"


class MoxfieldDeckType(DjangoObjectType):
    class Meta:
        model = MoxfieldDeck
        fields = "__all__"


class MoxfieldHubType(DjangoObjectType):
    class Meta:
        model = MoxfieldHub
        fields = "__all__"


class MoxfieldBoardType(DjangoObjectType):
    class Meta:
        model = MoxfieldBoard
        fields = "__all__"


class MoxfieldBoardCardType(DjangoObjectType):
    class Meta:
        model = MoxfieldBoardCard
        fields = "__all__"


# ----- Scryfall DjangoObjectTypes -----

class ScryfallCardType(DjangoObjectType):
    class Meta:
        model = ScryfallCard
        fields = "__all__"


class ScryfallCardFaceType(DjangoObjectType):
    class Meta:
        model = ScryfallCardFace
        fields = "__all__"


# ----- Topdeck DjangoObjectTypes -----

class TopdeckTournamentType(DjangoObjectType):
    class Meta:
        model = TopdeckTournament
        fields = "__all__"


class TopdeckPlayerStandingType(DjangoObjectType):
    class Meta:
        model = TopdeckPlayerStanding
        fields = "__all__"


# ----- Root Query -----
# You can expose these models via queries if you'd like, for example:

class Query(graphene.ObjectType):
    # Example field to list all Moxfield authors
    all_moxfield_authors = graphene.List(MoxfieldAuthorType)

    def resolve_all_moxfield_authors(root, info):
        return MoxfieldAuthor.objects.all()

    # Add any other queries you want (Decks, Cards, etc.)


schema = graphene.Schema(query=Query)
