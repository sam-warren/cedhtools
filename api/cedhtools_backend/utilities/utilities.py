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
