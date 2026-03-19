import os

from google import genai
from google.genai.types import EmbedContentConfig

EMBEDDING_MODEL = "gemini-embedding-001"
OUTPUT_DIMENSIONALITY = 768

_client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
_config = EmbedContentConfig(output_dimensionality=OUTPUT_DIMENSIONALITY)


def embed_text(text: str) -> list[float]:
    result = _client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=text,
        config=_config,
    )
    return result.embeddings[0].values


def embed_texts(texts: list[str]) -> list[list[float]]:
    result = _client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=texts,
        config=_config,
    )
    return [e.values for e in result.embeddings]
