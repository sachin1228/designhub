from __future__ import annotations

import tempfile
from pathlib import Path
from threading import Lock
from typing import Any

from nudenet import NudeDetector


class NudeNetDetector:
    def __init__(self) -> None:
        self._lock = Lock()
        self._detector: NudeDetector | None = None

    def _get_detector(self) -> NudeDetector:
        if self._detector is None:
            with self._lock:
                if self._detector is None:
                    self._detector = NudeDetector()
        return self._detector

    def detect(self, image_bytes: bytes, suffix: str) -> list[dict[str, Any]]:
        detector = self._get_detector()
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(image_bytes)
            tmp_path = Path(tmp.name)

        try:
            return detector.detect(str(tmp_path))
        finally:
            tmp_path.unlink(missing_ok=True)


detector = NudeNetDetector()
