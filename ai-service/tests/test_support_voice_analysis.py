from app.services.support_chat import SupportChatService


def test_voice_analysis_validation_bounds_score_and_level():
    service = SupportChatService()

    result = service._validate_voice_analysis({
        "transcription": "Je suis tres stresse ce soir, j'ai envie de fumer.",
        "voice_stress_score": 120,
        "voice_stress_level": "unknown",
        "voice_stress_summary": "Tension vocale apparente, estimation non diagnostique.",
        "voice_stress_signals": ["debit rapide", "", "voix tendue"],
    })

    assert result["transcription"].startswith("Je suis tres stresse")
    assert result["voice_stress_score"] == 100
    assert result["voice_stress_level"] == "CRITICAL"
    assert result["voice_stress_signals"] == ["debit rapide", "voix tendue"]


def test_voice_stress_fallback_does_not_alert_by_itself():
    service = SupportChatService()

    result = service._fallback(
        latest_patient_message="Je suis stresse ce soir.",
        patient_facts={"voice_analysis": {"stress_score": 78}},
        emergency_mode=False,
        preferred_language="fr",
    )

    assert result["risk_level"] == "MODERATE"
    assert result["should_alert_doctor"] is False
    assert "diagnostic" in result["reply"]
