# cedhtools_backend/services.py
import requests
import os

MOXFIELD_API_BASE_URL = os.getenv("MOXFIELD_API_BASE_URL")
MOXFIELD_USER_AGENT = os.getenv("MOXFIELD_USER_AGENT")

def fetch_moxfield_deck(deck_id):
    print("getting moxfield deck ", deck_id)
    url = f"{MOXFIELD_API_BASE_URL}/decks/all/{deck_id}"
    headers = {
        "User-Agent": MOXFIELD_USER_AGENT
    }
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.json()
