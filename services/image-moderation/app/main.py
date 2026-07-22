from __future__ import annotations

import time

from fastapi import FastAPI, File, HTTPException, UploadFile

from app.config import get_settings
from app.detector import detector
from app.policy import decide

app = FastAPI(title="DesignHub Image Moderation", version="1.0.0")

SUFFIX_BY_MIME = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/moderate")
async def moderate(file: UploadFile = File(...)) -> dict[str, object]:
    start = time.perf_counter()
    settings = get_settings()

    if file.content_type not in settings.allowed_mime_types:
        raise HTTPException(status_code=415, detail="Unsupported image type.")

    image_bytes = await file.read(settings.max_upload_bytes + 1)
    if not image_bytes:
        raise HTTPException(status_code=422, detail="Empty image upload.")
    if len(image_bytes) > settings.max_upload_bytes:
        raise HTTPException(status_code=413, detail="Image exceeds maximum size.")

    try:
        detections = detector.detect(image_bytes, SUFFIX_BY_MIME[file.content_type])
        response = decide(detections, settings)
        response["duration_ms"] = int((time.perf_counter() - start) * 1000)
        return response
    except HTTPException:
        raise
    except Exception as exc:
        print(f"[image-moderation] detector error: {exc}")
        return {
            "status": "review",
            "allowed": False,
            "reason": "Image moderation detector failed.",
            "provider": "nudenet",
            "confidence": 1,
            "triggered_rules": [],
            "scores": {},
            "duration_ms": int((time.perf_counter() - start) * 1000),
        }
