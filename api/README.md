# cedhtools backend
This is a Django API that serves as the backend for the cedhtools project. It is responsible for fetching data from internal and external APIs and serving it to the frontend. 

## Prerequisites
Ensure you have the following tools installed on your machine:
1. Python 3.8
2. PostgreSQL
3. Pip

You will also need a .env file in the root directory of the api folder. The .env file should contain the following environment variables:
```
PG_DB_NAME=cedhtools
PG_USER=YOUR_PG_USER
PG_PASSWORD=YOUR_PG_PASSWORD
PG_HOST=localhost
PG_PORT=5432

MOXFIELD_API_BASE_URL=https://api2.moxfield.com/v3
MOXFIELD_USER_AGENT=YOUR_USER_AGENT_KEY

TOPDECK_API_BASE_URL=https://topdeck.gg/api
TOPDECK_API_KEY=YOUR_TOPDECK_API_KEY
```
To acquire a Moxfield user agent key, reach out to support@moxfield.com.  
To acquire a Topdeck API key, visit https://topdeck.gg/docs/tournaments-v2, click "Get API Key" in the top-right of the page, and follow the instructions.

## Development Environment
To run the project:
1. Initialize a PostgreSQL database with the name `cedhtools` and configure your .env file accordingly.
2. Run `pip install -r requirements.txt` to install the required dependencies.
## API Request Limits
- Moxfield: 1 request per second
- Topdeck: 200 requests per minute
3. Run `python manage.py migrate` to apply the migrations.
4. To seed the database with data, run `python manage.py import_topdeck_data`.
5. To start the development server, run `python manage.py runserver`.

## Documentation:
- Topdeck: https://topdeck.gg/docs/tournaments-v2
- Scryfall: https://scryfall.com/docs/api
