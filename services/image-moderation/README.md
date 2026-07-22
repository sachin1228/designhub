# DesignHub Image Moderation Service

FastAPI service that wraps NudeNet for DesignHub image uploads. The model is loaded once per process and reused across requests.

## Endpoints

- `GET /health`
- `POST /moderate` with multipart `file`

The moderation response matches the Next.js contract:

```json
{
  "status": "approved",
  "allowed": true,
  "reason": "",
  "provider": "nudenet",
  "confidence": 0.99,
  "triggered_rules": [],
  "scores": {},
  "duration_ms": 42
}
```

## Local Run

```bash
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Set `MODERATION_IMAGE_SERVICE_URL=http://localhost:8000` in the Next.js app.
