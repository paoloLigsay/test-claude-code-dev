from fastapi import FastAPI

from routers.text import router as text_router
from routers.rag import router as rag_router

app = FastAPI(title="AI Service")
app.include_router(text_router)
app.include_router(rag_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
