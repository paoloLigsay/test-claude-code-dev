from chunker import CHUNK_SIZE, CHUNK_OVERLAP, chunk_text


def test_short_text_returns_single_chunk():
    text = "This is a short sentence."
    result = chunk_text(text)

    assert result == [text]


def test_long_text_splits_into_multiple_chunks():
    sentences = [f"Sentence number {i} is here." for i in range(100)]
    text = " ".join(sentences)
    assert len(text) > CHUNK_SIZE

    chunks = chunk_text(text)

    assert len(chunks) > 1
    for chunk in chunks:
        assert len(chunk) <= CHUNK_SIZE + 200  # allow tolerance for sentence boundaries


def test_chunks_have_overlapping_content():
    sentences = [f"Sentence number {i} is here." for i in range(100)]
    text = " ".join(sentences)

    chunks = chunk_text(text)

    for i in range(len(chunks) - 1):
        end_of_current = chunks[i][-CHUNK_OVERLAP:]
        assert end_of_current in chunks[i + 1], "Adjacent chunks should share overlapping text"
