import re

CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200


def chunk_text(text: str) -> list[str]:
    """Split text into overlapping chunks at sentence boundaries."""
    if len(text) <= CHUNK_SIZE:
        return [text]

    sentences = re.split(r"(?<=[.!?])\s+", text)
    chunks: list[str] = []
    current = ""

    for sentence in sentences:
        if len(current) + len(sentence) > CHUNK_SIZE and current:
            chunks.append(current.strip())
            overlap_start = max(0, len(current) - CHUNK_OVERLAP)
            current = current[overlap_start:] + " " + sentence
        else:
            current = (current + " " + sentence) if current else sentence

    if current.strip():
        chunks.append(current.strip())

    return chunks
