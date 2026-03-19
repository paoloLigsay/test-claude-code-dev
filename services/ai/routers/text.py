from fastapi import APIRouter, Depends
from pydantic import BaseModel

from dependencies import verify_api_key
from gemini_client import generate
from prompts import POLISH_DOCUMENT, SUMMARIZE_DOCUMENT

router = APIRouter(prefix="/text", dependencies=[Depends(verify_api_key)])


class TextRequest(BaseModel):
    content: str


class TextResponse(BaseModel):
    result: str


@router.post("/polish", response_model=TextResponse)
def polish(request: TextRequest) -> TextResponse:
    result = generate(POLISH_DOCUMENT, request.content)
    return TextResponse(result=result)


@router.post("/summarize", response_model=TextResponse)
def summarize(request: TextRequest) -> TextResponse:
    result = generate(SUMMARIZE_DOCUMENT, request.content)
    return TextResponse(result=result)
