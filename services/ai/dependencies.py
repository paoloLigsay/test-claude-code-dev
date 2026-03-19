import os

from fastapi import Header, HTTPException


INTERNAL_API_KEY = os.environ["INTERNAL_API_KEY"]


def verify_api_key(x_api_key: str = Header()) -> None:
    if x_api_key != INTERNAL_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
