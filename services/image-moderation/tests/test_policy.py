from app.config import Settings
from app.policy import decide


def test_explicit_exposure_is_rejected() -> None:
    result = decide([{"class": "FEMALE_GENITALIA_EXPOSED", "score": 0.91}], Settings())

    assert result["status"] == "rejected"
    assert result["allowed"] is False


def test_borderline_explicit_exposure_requires_review() -> None:
    result = decide([{"class": "MALE_GENITALIA_EXPOSED", "score": 0.5}], Settings())

    assert result["status"] == "review"
    assert result["allowed"] is False


def test_safe_image_is_approved() -> None:
    result = decide([{"class": "FACE_FEMALE", "score": 0.99}], Settings())

    assert result["status"] == "approved"
    assert result["allowed"] is True
