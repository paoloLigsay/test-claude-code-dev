# Feature: AI Service (Python FastAPI)

Python FastAPI microservice that handles all AI processing. Lives in `services/ai/`.

## Setup

```bash
cd services/ai
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # then fill in values
```

## Running

First activate the virtual environment, then start the server:

```bash
cd services/ai
source .venv/bin/activate
uvicorn main:app --reload --port 8000 --env-file .env
```

Or from the project root (no need to activate venv manually):

```bash
npm run dev:ai
```

Runs on `http://localhost:8000`. Next.js connects via `AI_SERVICE_URL` env var.

## Development Workflow

Run both services in separate terminals:

```bash
# Terminal 1: Next.js
npm run dev

# Terminal 2: AI Service
npm run dev:ai
```

## Environment Variables

| Variable           | Purpose                                                   |
| ------------------ | --------------------------------------------------------- |
| `GEMINI_API_KEY`   | Google Gemini API access                                  |
| `INTERNAL_API_KEY` | Shared secret — must match the Next.js `INTERNAL_API_KEY` |

## Authentication

Every request must include `x-api-key` header matching `INTERNAL_API_KEY`. Requests without it are rejected with 401/422.

## Endpoints

### `GET /health`

Health check. Returns `{ "status": "ok" }`. No auth required.

### `POST /text/polish`

- Request: `{ "content": string }`
- Response: `{ "result": string }`
- Polishes text for grammar, spelling, clarity, and formatting.

### `POST /text/summarize`

- Request: `{ "content": string }`
- Response: `{ "result": string }`
- Summarizes text into 3-5 paragraphs.

## File Structure

| File               | Purpose                                           |
| ------------------ | ------------------------------------------------- |
| `main.py`          | FastAPI app, health endpoint, router registration |
| `routers/text.py`  | `/text/polish` and `/text/summarize` endpoints    |
| `gemini_client.py` | Thin wrapper around `google-genai` SDK            |
| `prompts.py`       | AI prompt constants                               |
| `dependencies.py`  | `verify_api_key` dependency for auth              |

## Dependencies

- `fastapi` — web framework
- `uvicorn` — ASGI server
- `google-genai` — Google Gemini SDK (new package, replaces deprecated `google-generativeai`)
- `pydantic` — request/response validation
- `python-dotenv` — required by uvicorn's `--env-file` flag

## Troubleshooting

### `ModuleNotFoundError: No module named 'dotenv'`

Run `pip install -r requirements.txt` — the `python-dotenv` package is missing.

### `pip install` with no arguments

Always specify the requirements file: `pip install -r requirements.txt`

### `zsh: permission denied: .venv/bin/`

Don't run the directory itself. Either activate the venv first (`source .venv/bin/activate`) then run commands normally, or reference the binary directly (`.venv/bin/uvicorn ...`).
