from django.core.exceptions import ValidationError
from django.core.validators import URLValidator

def validate_moxfield_url(value):
    """
    Validator to ensure the decklist URL is a valid Moxfield URL.
    """
    if not value:
        return

    url_validator = URLValidator()
    try:
        url_validator(value)
    except ValidationError:
        raise ValidationError('Invalid URL format.')

    if not value.startswith('https://www.moxfield.com/decks/'):
        raise ValidationError('Decklist must be a Moxfield URL.')