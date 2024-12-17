import datetime


def create_success_response(data: dict) -> dict:
    return {
        "data": data,
        "error": False,
        "error_message": "",
        "status": 200
    }


def create_error_response(error_message: str, status: int) -> dict:
    return {
        "data": None,
        "error": True,
        "error_message": error_message,
        "status": status
    }


def date_str_to_unix_timestamp(date_str):
    """
    Converts a date string in 'YYYY-MM-DD' format to a Unix timestamp in seconds.
    """
    dt = datetime.datetime.strptime(date_str, '%Y-%m-%d')
    return int(dt.replace(tzinfo=datetime.timezone.utc).timestamp())


def unix_timestamp_to_date(timestamp):
    """
    Converts a Unix timestamp in seconds to a date object.
    """
    return datetime.datetime.fromtimestamp(timestamp, tz=datetime.timezone.utc).date()
