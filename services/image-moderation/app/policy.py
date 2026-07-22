from __future__ import annotations

from typing import Any

from app.config import Settings


REJECT_CLASSES = {
    "FEMALE_GENITALIA_EXPOSED",
    "MALE_GENITALIA_EXPOSED",
    "ANUS_EXPOSED",
    "BUTTOCKS_EXPOSED",
}

REVIEW_CLASSES = {
    "FEMALE_BREAST_EXPOSED",
    "FEMALE_BREAST_COVERED",
    "MALE_BREAST_EXPOSED",
    "BELLY_EXPOSED",
    "ARMPITS_EXPOSED",
    "FEET_EXPOSED",
}


def normalize_class_name(value: str) -> str:
    return value.strip().upper().replace(" ", "_").replace("-", "_")


def decide(detections: list[dict[str, Any]], settings: Settings) -> dict[str, Any]:
    triggered_rules: list[dict[str, Any]] = []
    scores: dict[str, float] = {}
    status = "approved"
    reason = ""
    confidence = 0.99

    for detection in detections:
        class_name = normalize_class_name(str(detection.get("class", "")))
        score = float(detection.get("score", 0))
        scores[class_name] = max(scores.get(class_name, 0), score)

        if class_name in REJECT_CLASSES and score >= settings.reject_min_confidence:
            triggered_rules.append({
                "rule": "nudenet_explicit_exposure",
                "category": "sexual",
                "action": "rejected",
                "confidence": score,
                "detail": class_name,
            })
            status = "rejected"
            reason = "Explicit nudity detected."
            confidence = max(confidence if confidence < 0.99 else 0, score)
        elif class_name in REJECT_CLASSES and score >= settings.borderline_min_confidence:
            triggered_rules.append({
                "rule": "nudenet_borderline_explicit_exposure",
                "category": "sexual",
                "action": "review",
                "confidence": score,
                "detail": class_name,
            })
            if status != "rejected":
                status = "review"
                reason = "Borderline explicit nudity confidence."
                confidence = max(confidence if confidence < 0.99 else 0, score)
        elif class_name in REVIEW_CLASSES and score >= settings.borderline_min_confidence:
            triggered_rules.append({
                "rule": "nudenet_possible_nudity",
                "category": "sexual",
                "action": "review",
                "confidence": score,
                "detail": class_name,
            })
            if status == "approved":
                status = "review"
                reason = "Possible nudity requires review."
                confidence = score

    return {
        "status": status,
        "allowed": status == "approved",
        "reason": reason,
        "provider": "nudenet",
        "confidence": confidence,
        "triggered_rules": triggered_rules,
        "scores": scores,
    }
