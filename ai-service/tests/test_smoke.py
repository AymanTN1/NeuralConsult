from app.api import health


def test_health():
    assert health.__name__ == "health"
